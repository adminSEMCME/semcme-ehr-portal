const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    module, exports: module.exports, Buffer,
    require(name) { assert.ok(name in dependencies, `Unexpected dependency: ${name}`); return dependencies[name]; },
    process: { env: { RESEND_API_KEY: 'mock' } }, console: { error() {} },
  });
  return module.exports;
}
const next = { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };

async function testSupport() {
  const config = load('lib/supportForms.ts');
  const sends = [];
  let fail = false;
  class Resend {
    emails = { send: async (message) => {
      sends.push(message);
      return fail ? { error: { message: 'Provider unavailable' } } : { data: { id: 'mock-id' }, error: null };
    } };
  }
  const { sendSupportRequest: send } = load('lib/sendSupportRequest.ts', {
    'next/server': next, resend: { Resend }, '@/lib/supportForms': config,
  });
  function request(kind, changes = {}) {
    const form = new FormData();
    const values = {
      name: '<script>Test</script>', email: 'requester@example.org',
      category: config.supportForms[kind].categories[0], message: 'First line\nSecond & third',
      accountName: 'Learner', accountEmail: 'learner@example.org', institution: 'Example Hospital',
      module: 'UME 1', ...changes,
    };
    for (const [key, value] of Object.entries(values)) form.set(key, value);
    return { form, formData: async () => form };
  }
  for (const kind of ['account', 'technical', 'program']) {
    const req = request(kind);
    req.form.append('attachments', new Blob(['screenshot details'], { type: 'text/plain' }), 'details.txt');
    assert.equal((await send(req, kind)).status, 200);
    const message = sends.at(-1);
    assert.equal(JSON.stringify(message.to), JSON.stringify(['sross@semcme.org', 'NJuzych@semcme.org']));
    assert.equal(message.replyTo, 'requester@example.org');
    assert.ok(message.subject.includes(config.supportForms[kind].title));
    assert.ok(message.html.includes('&lt;script&gt;'));
    assert.ok(!message.html.includes('<script>'));
    assert.ok(message.text.includes('First line\nSecond & third'));
    assert.equal(message.attachments[0].content.toString(), 'screenshot details');
    if (kind === 'account') assert.ok(message.text.includes('learner@example.org'));
  }
  const count = sends.length;
  for (const changes of [{ email: 'invalid' }, { name: '  ' }, { category: 'made up' }, { message: '' }]) {
    assert.equal((await send(request('technical', changes), 'technical')).status, 400);
  }
  assert.equal((await send(request('account', { accountEmail: '' }), 'account')).status, 400);
  assert.equal((await send({ formData: async () => { throw Error('bad body'); } }, 'technical')).status, 400);
  for (const mode of ['type', 'size', 'count']) {
    const req = request('technical');
    if (mode === 'type') req.form.append('attachments', new Blob(['bad'], { type: 'application/javascript' }), 'bad.js');
    if (mode === 'size') req.form.append('attachments', new Blob([Buffer.alloc(config.MAX_ATTACHMENT_BYTES + 1)], { type: 'text/plain' }), 'large.txt');
    if (mode === 'count') for (let i = 0; i < 4; i++) req.form.append('attachments', new Blob(['ok'], { type: 'text/plain' }), `${i}.txt`);
    assert.equal((await send(req, 'technical')).status, 400);
  }
  assert.equal(sends.length, count);
  fail = true;
  const failed = await send(request('technical'), 'technical');
  assert.equal(failed.status, 502);
  assert.equal(failed.body.success, undefined);
  console.log('Support: all three routes, both recipients, reply-to, actual attachments, validation, escaping, and delivery failures passed.');
}

async function testUserEditing() {
  const userId = '11111111-1111-4111-8111-111111111111';
  const institutionId = '22222222-2222-4222-8222-222222222222';
  let caller = null;
  let serviceCalls = 0;
  let profile = { id: userId, email: 'old@example.org', first_name: 'Old', last_name: 'Name', role: 'Medical Student', institution_id: institutionId, is_approved: true };
  let target = { id: userId, email: 'old@example.org', email_confirmed_at: '2026-01-01', user_metadata: {} };
  let institution = { id: institutionId, name: 'Example Hospital' };
  let duplicate = false;
  let databaseFailure = false;
  let rollbackFailure = false;
  let authCalls = [];
  let writes = [];
  const admin = {
    auth: { admin: {
      getUserById: async () => ({ data: { user: target } }),
      updateUserById: async (id, changes) => {
        assert.equal(id, userId);
        authCalls.push(changes);
        if (duplicate) return { error: { code: 'email_exists', status: 422 } };
        if (rollbackFailure && changes.email === 'old@example.org') return { error: { message: 'rollback failed' } };
        return { error: null };
      },
    } },
    from(table) {
      let update;
      const query = {
        select() { return query; }, eq() { return query; },
        update(value) { update = value; writes.push(value); return query; },
        async maybeSingle() {
          if (table === 'institutions') return { data: institution };
          if (update && databaseFailure) return { error: { message: 'Database unavailable' } };
          return { data: profile ? { ...profile, ...update } : null };
        },
      };
      return query;
    },
  };
  const { POST } = load('app/api/admin/update-user/route.ts', {
    'next/server': next,
    '@/lib/supabaseServer': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: caller } }) } }) },
    '@supabase/supabase-js': { createClient: () => { serviceCalls++; return admin; } },
    '@/lib/adminAccounts': load('lib/adminAccounts.ts'),
    '@/lib/userRoles': load('lib/userRoles.ts'),
  });
  const request = (changes = {}) => ({ json: async () => ({ userId, institutionId, firstName: ' New ', lastName: ' Name ', email: 'NEW@example.org', role: 'Resident', ...changes }) });
  assert.equal((await POST(request())).status, 401);
  for (const role of ['Institution Administrator', 'Medical Student', 'admin', undefined]) {
    caller = { user_metadata: { role } };
    assert.equal((await POST(request())).status, 403);
  }
  assert.equal(serviceCalls, 0);
  caller = { email: 'admin@semcme.org', email_confirmed_at: '2026-01-01', user_metadata: { role: 'admin' } };
  for (const changes of [{ email: 'bad' }, { firstName: '' }, { lastName: '' }, { role: 'admin' }, { role: 'unknown' }, { institutionId: 'bad' }, { userId: 'bad' }]) {
    assert.equal((await POST(request(changes))).status, 400);
  }
  assert.equal((await POST({ json: async () => null })).status, 400);
  assert.equal(writes.length, 0);
  const result = await POST(request({ progress_percent: 0, is_approved: false }));
  assert.equal(result.status, 200);
  assert.equal(result.body.first_name, 'New');
  assert.equal(result.body.email, 'new@example.org');
  assert.equal(result.body.role, 'Resident');
  assert.equal(authCalls[0].email, 'new@example.org');
  assert.equal(writes[0].progress_percent, undefined);
  assert.equal(writes[0].is_approved, true);
  authCalls = []; writes = [];
  duplicate = true;
  assert.equal((await POST(request())).status, 400);
  assert.equal(writes.length, 0);
  duplicate = false;
  databaseFailure = true; authCalls = [];
  assert.equal((await POST(request())).status, 500);
  assert.equal(authCalls.length, 2);
  assert.equal(authCalls[1].email, 'old@example.org');
  rollbackFailure = true;
  assert.match((await POST(request())).body.error, /sign-in email changed/);
  databaseFailure = false; rollbackFailure = false;
  const promotion = await POST(request({ role: 'Institution Administrator' }));
  assert.equal(promotion.body.is_approved, false);
  assert.equal(promotion.body.needsApproval, true);
  profile.role = 'Institution Administrator';
  assert.equal((await POST(request({ role: 'Institution Administrator' }))).body.is_approved, true);
  const newInstitution = '33333333-3333-4333-8333-333333333333';
  institution = { id: newInstitution, name: 'New Hospital' };
  assert.equal((await POST(request({ role: 'Institution Administrator', institutionId: newInstitution }))).body.is_approved, false);
  assert.equal((await POST(request({ role: 'Institution Administrator', institutionId: null }))).status, 400);
  assert.equal((await POST(request({ institutionId: null }))).status, 200);
  institution = null;
  assert.equal((await POST(request())).status, 400);
  target.user_metadata.role = 'admin';
  assert.equal((await POST(request())).status, 403);
  target.user_metadata.role = undefined;
  target.email = 'admin@semcme.org';
  assert.equal((await POST(request())).status, 403);
  profile = null;
  assert.equal((await POST(request())).status, 404);
  console.log('User editing: IA/learner denial, validation, Auth email synchronization, duplicate email, rollback, protected admins, IA approval, and preserved progress passed.');
}

testSupport().then(testUserEditing).catch((error) => { console.error(error); process.exitCode = 1; });
