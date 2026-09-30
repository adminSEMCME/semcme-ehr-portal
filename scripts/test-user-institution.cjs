const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { module, exports: module.exports, require: name => dependencies[name],
    process: { env: {} }, console: { error() {} } });
  return module.exports;
}
async function main() {
  const userId = '11111111-1111-4111-8111-111111111111';
  const institutionId = '22222222-2222-4222-8222-222222222222';
  let user = null;
  let institution = { id: institutionId, name: 'Correct institution' };
  let missingUser = false;
  let dbError = null;
  let writes = 0;
  let serviceCalls = 0;
  const next = { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };
  const admin = { from(table) {
    assert.ok(['profiles', 'institutions'].includes(table));
    const query = {
      select() { return query; },
      eq(key, value) { assert.equal(key, 'id'); assert.equal(value, table === 'profiles' ? userId : institutionId); return query; },
      update(value) {
        assert.equal(table, 'profiles');
        assert.equal(JSON.stringify(value), JSON.stringify({ institution_id: institutionId }));
        writes++;
        return query;
      },
      async maybeSingle() { return { data: table === 'institutions' ? institution : missingUser ? null : { id: userId, institution_id: institutionId }, error: dbError }; },
    };
    return query;
  } };
  const { POST } = load('app/api/admin/update-user-institution/route.ts', {
    'next/server': next,
    '@/lib/adminAccounts': load('lib/adminAccounts.ts', {}),
    '@/lib/supabaseServer': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }) },
    '@supabase/supabase-js': { createClient: () => { serviceCalls++; return admin; } },
  });
  const req = (body = { userId, institutionId }) => ({ json: async () => body });
  assert.equal((await POST(req())).status, 401);
  for (const role of ['Medical Student', 'Institution Administrator', 'admin', undefined]) {
    user = { id: 'caller', user_metadata: { role } };
    assert.equal((await POST(req())).status, 403);
  }
  assert.equal(serviceCalls, 0);
  user = { id: 'caller', email: 'admin@semcme.org', email_confirmed_at: '2026-01-01', user_metadata: { role: 'admin' } };
  for (const body of [null, {}, { userId, institutionId: '' }, { userId: {}, institutionId }, { userId, institutionId: 'invalid' }]) {
    assert.equal((await POST(req(body))).status, 400);
  }
  assert.equal((await POST({ json: async () => { throw Error('Bad JSON'); } })).status, 400);
  assert.equal(writes, 0);
  institution = null;
  assert.equal((await POST(req())).status, 400);
  assert.equal(writes, 0);
  institution = { id: institutionId, name: 'Correct institution' };
  const result = await POST(req({ userId, institutionId, role: 'admin', progress_percent: 0 }));
  assert.equal(result.status, 200);
  assert.equal(result.body.institution, institution.name);
  assert.equal(writes, 1);
  missingUser = true;
  assert.equal((await POST(req())).status, 404);
  dbError = Error('database unavailable');
  assert.equal((await POST(req())).status, 500);
  const legacy = load('app/api/register/profile/route.ts', { 'next/server': next });
  assert.equal((await legacy.POST(req())).status, 410);
  console.log('Institution update checks passed: admin access, IA/student denial, validation, field preservation, missing records, database failures, retired bypass.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
