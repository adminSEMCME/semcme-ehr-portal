const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies, env = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    module, exports: module.exports,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    process: { env }, console: { error() {} },
    setTimeout: (callback) => callback(),
  });
  return module.exports;
}

async function main() {
  const registration = {
    userId: 'user-123', firstName: '<script>alert(1)</script>', lastName: 'Smith',
    email: 'test@example.org', institution: 'Example & Hospital',
  };
  const sends = [];
  let failures = 0;
  class Resend {
    emails = { send: async (...args) => {
      sends.push(args);
      if (failures-- > 0) return { error: { name: 'server_error', message: 'Retry' } };
      return { data: { id: 'email-id' }, error: null };
    } };
  }
  const { notifyInstitutionAdminRegistration: notify } = load(
    'lib/institutionAdminNotification.ts', { resend: { Resend } }, { RESEND_API_KEY: 'mock' },
  );
  assert.equal(await notify(registration), true);
  assert.equal(sends.length, 1);
  assert.equal(sends[0][0].to[0], 'NJuzych@semcme.org');
  assert.ok(sends[0][0].html.includes('&lt;script&gt;'));
  assert.ok(!sends[0][0].html.includes('<script>'));
  assert.ok(sends[0][0].html.includes('Example &amp; Hospital'));
  assert.ok(sends[0][0].html.includes('/admin-dashboard#adminApprovals'));
  failures = 1;
  assert.equal(await notify(registration), true);
  assert.equal(sends.length, 3);
  assert.equal(sends[1][1].idempotencyKey, sends[2][1].idempotencyKey);
  failures = 2;
  assert.equal(await notify(registration), false);
  assert.equal(sends.length, 5);
  const missingKey = load('lib/institutionAdminNotification.ts', { resend: { Resend } });
  assert.equal(await missingKey.notifyInstitutionAdminRegistration(registration), false);
  assert.equal(sends.length, 5);

  // Exercise the real registration route with all external services mocked.
  for (const scenario of ['ia', 'learner', 'profile-error', 'duplicate', 'email-error']) {
    const notifications = [];
    const deletions = [];
    let profile;
    const client = {
      auth: {
        signUp: async () => ({ data: { user: { id: 'user-123', identities: scenario === 'duplicate' ? [] : [{}] } } }),
        admin: { deleteUser: async (id) => { deletions.push(id); return {}; } },
      },
      from: (table) => {
        if (table === 'profiles') return { insert: async (value) => {
          profile = value;
          return { error: scenario === 'profile-error' ? { message: 'Failed' } : null };
        } };
        assert.equal(table, 'institutions');
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { name: 'Example Hospital' } }) }) }) };
      },
    };
    const { POST } = load('app/api/register/route.ts', {
      'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
      '@supabase/supabase-js': { createClient: () => client },
      '@/lib/institutionName': { normalizeInstitutionName: (name) => name.trim(), hasAtLeastTwoWords: () => true },
      '@/lib/institutionAdminNotification': { notifyInstitutionAdminRegistration: async (value) => {
        notifications.push(value);
        if (scenario === 'email-error') throw new Error('Email unavailable');
      } },
    }, { NEXT_PUBLIC_SUPABASE_URL: 'mock', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock', SUPABASE_SERVICE_ROLE_KEY: 'mock' });
    const response = await POST({ json: async () => ({
      email: 'test@example.org', password: 'password123', first_name: 'Test', last_name: 'Applicant',
      institution_id: 'institution-123', role: scenario === 'learner' ? 'Resident' : 'Institution Administrator',
    }) });
    assert.equal(response.status, scenario === 'profile-error' ? 500 : scenario === 'duplicate' ? 409 : 200);
    assert.equal(notifications.length, ['ia', 'email-error'].includes(scenario) ? 1 : 0);
    assert.equal(deletions.length, scenario === 'profile-error' ? 1 : 0);
    if (scenario === 'ia') {
      assert.equal(profile.is_approved, false);
      assert.equal(notifications[0].institution, 'Example Hospital');
    }
    if (scenario === 'learner') assert.equal(profile.is_approved, true);
  }
  console.log('PASS: recipient, escaping, dashboard link, retry/idempotency, missing key, role filtering, failed/duplicate signup, and preserving registration on email failure. No network calls or live emails.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
