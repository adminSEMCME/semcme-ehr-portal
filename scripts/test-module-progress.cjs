const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { module, exports: module.exports, require: name => dependencies[name],
    process: { env: {} }, console: { error() {} } });
  return module.exports;
}
async function main() {
  const { startModuleProgress } = load('lib/startModuleProgress.ts');
  let row;
  let insertError = null;
  let updateError = null;
  const client = { from: () => ({
    async upsert(value, options) {
      assert.equal(options.onConflict, 'user_id,module_id');
      if (!insertError && (!row || !options.ignoreDuplicates)) row = { ...value };
      return { error: insertError };
    },
    update(value) {
      const filters = {};
      const query = { eq(key, val) { filters[key] = val; return query; },
        then(resolve) {
          assert.equal(filters.user_id, 'student');
          assert.equal(filters.module_id, 'module');
          if (!updateError) Object.assign(row, value);
          resolve({ error: updateError });
        } };
      return query;
    },
  }) };
  await startModuleProgress(client, 'student', 'module');
  assert.equal(row.progress_percent, 0);
  assert.equal(row.status, 'in_progress');
  for (const status of ['in_progress', 'completed']) {
    row = { user_id: 'student', module_id: 'module', status,
      progress_percent: status === 'completed' ? 100 : 55,
      date_started: 'original', date_completed: 'completion' };
    const before = { ...row };
    await Promise.all([startModuleProgress(client, 'student', 'module'), startModuleProgress(client, 'student', 'module')]);
    const { last_accessed, ...after } = row;
    assert.ok(last_accessed);
    assert.deepEqual(after, before);
  }
  insertError = new Error('insert failed');
  await assert.rejects(startModuleProgress(client, 'student', 'module'), /insert failed/);
  insertError = null;
  updateError = new Error('update failed');
  await assert.rejects(startModuleProgress(client, 'student', 'module'), /update failed/);

  let user = { id: 'student' };
  let saveError = null;
  let readError = null;
  let existing = null;
  let writes = 0;
  const server = { auth: { getUser: async () => ({ data: { user } }) }, from: () => ({
    select() { const q = { eq() { return q; }, maybeSingle: async () => ({ data: existing, error: readError }) }; return q; },
    upsert: async () => { writes++; return { error: saveError }; },
  }) };
  const { POST } = load('app/api/progress/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    'next/headers': { cookies: async () => ({ getAll: () => [] }) },
    '@supabase/ssr': { createServerClient: () => server },
  });
  const request = { json: async () => ({ module_id: 'module', status: 'in_progress', progress_percent: 50 }) };
  assert.equal((await POST(request)).status, 200);
  saveError = new Error('save failed');
  assert.equal((await POST(request)).status, 500);
  saveError = null;
  readError = new Error('read failed');
  const priorWrites = writes;
  assert.equal((await POST(request)).status, 500);
  assert.equal(writes, priorWrites);
  readError = null;
  existing = { status: 'completed', progress_percent: 100 };
  assert.equal((await POST(request)).status, 200);
  assert.equal(writes, priorWrites);
  user = null;
  assert.equal((await POST(request)).status, 401);
  assert.equal(writes, priorWrites);
  console.log('Progress regression checks passed: initialization, concurrent reopening, preservation, write/read failures, and authentication.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
