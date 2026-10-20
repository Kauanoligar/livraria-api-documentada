const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'livraria-test-'));
process.env.JWT_SECRET = 'chave-isolada-exclusiva-para-testes';
process.env.BCRYPT_ROUNDS = '4';
process.env.DATABASE_PATH = path.join(temp, 'database.json');
const app = require('../app');
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); fs.rmSync(temp, { recursive: true }); });
async function request(uri, method = 'GET', body, token) {
  const res = await fetch(base + uri, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: res.status, body: await res.json() };
}
async function login(email, senha) { return (await request('/api/v1/auth/login', 'POST', { email, senha })).body.token; }
test('documentação pública: interface, JSON, contratos e segurança', async () => {
  const ui = await fetch(base + '/docs/');
  assert.equal(ui.status, 200);
  assert.match(await ui.text(), /swagger-ui/);
  const result = await request('/api-docs.json');
  assert.equal(result.status, 200);
  assert.equal(result.body.openapi, '3.0.3');
  await require('@apidevtools/swagger-parser').validate(result.body);
  assert.equal(result.body.components.securitySchemes.bearerAuth.scheme, 'bearer');
  assert.equal(Object.values(result.body.paths).reduce((n, p) => n + Object.keys(p).length, 0), 8);
  for (const [uri, verbs] of Object.entries(result.body.paths)) {
    for (const [verb, op] of Object.entries(verbs)) {
      assert.ok(op.summary && op.description);
      if (verb === 'post' && !uri.includes('/auth/')) {
        assert.deepEqual(op.security, [{ bearerAuth: [] }]);
        assert.ok(op.responses['401']);
      }
    }
  }
});
test('matriz de permissões e respostas reais dos oito endpoints', async () => {
  assert.equal((await request('/api/v1/livros')).status, 200);
  assert.equal((await request('/api/v1/livros/1')).status, 200);
  assert.equal((await request('/api/v1/livros/999')).status, 404);
  assert.equal((await request('/api/v1/autores')).status, 200);
  const reg = { nome: 'Maria Silva', email: 'maria@example.com', senha: 'Leitura@123', role: 'ADMIN' };
  const created = await request('/api/v1/auth/register', 'POST', reg);
  assert.equal(created.status, 201); assert.equal(created.body.role, 'USER'); assert.ok(!created.body.senha_hash);
  assert.equal((await request('/api/v1/auth/register', 'POST', reg)).status, 409);
  assert.equal((await request('/api/v1/auth/login', 'POST', { email: reg.email, senha: 'incorreta' })).status, 401);
  const user = await login(reg.email, reg.senha);
  const admin = await login('admin@livraria.com', 'Admin@123');
  assert.ok(user && admin);
  for (const [uri, body] of [['/api/v1/autores', { nome: 'Clarice' }], ['/api/v1/livros', { titulo: 'Teste', autor_id: 1 }]]) {
    assert.equal((await request(uri, 'POST', body)).status, 401);
    assert.equal((await request(uri, 'POST', body, user)).status, 403);
    assert.equal((await request(uri, 'POST', {}, admin)).status, 400);
    assert.equal((await request(uri, 'POST', body, admin)).status, 201);
  }
  const uri = '/api/v1/livros/1/comentarios';
  assert.equal((await request(uri, 'POST', { texto: 'Ótimo' })).status, 401);
  const comment = await request(uri, 'POST', { texto: 'Ótimo' }, user);
  assert.equal(comment.status, 201); assert.equal(comment.body.autor_nome, 'Maria Silva');
  assert.equal((await request('/api/v1/livros/999/comentarios', 'POST', { texto: 'Ótimo' }, user)).status, 404);
  assert.equal((await request('/api/v1/livros', 'POST', { titulo: 'Teste', autor_id: 999 }, admin)).status, 404);
  for (const token of ['invalido', jwt.sign({ sub: 1, role: 'USER' }, process.env.JWT_SECRET, { issuer: 'livraria-api', expiresIn: -1 })]) {
    assert.equal((await request(uri, 'POST', { texto: 'Ótimo' }, token)).status, 401);
  }
});
test('dados inválidos retornam 400, incluindo tipos e JSON malformado', async () => {
  assert.equal((await request('/api/v1/auth/register', 'POST', { nome: 10, email: 'a', senha: '123456' })).status, 400);
  assert.equal((await request('/api/v1/auth/login', 'POST', {})).status, 400);
  const admin = await login('admin@livraria.com', 'Admin@123');
  assert.equal((await request('/api/v1/livros', 'POST', { titulo: '   ', autor_id: 1 }, admin)).status, 400);
  assert.equal((await request('/api/v1/livros', 'POST', { titulo: 'Livro', autor_id: '1' }, admin)).status, 400);
  const res = await fetch(base + '/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(res.status, 400); assert.equal(typeof (await res.json()).erro, 'string');
});
