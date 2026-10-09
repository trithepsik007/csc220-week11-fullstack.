const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test-secret-for-api-contracts';
const app = require('../app');
const Student = require('../models/Student');
const User = require('../models/User');
let server, base;
const id = '507f1f77bcf86cd799439011';
const token = jwt.sign({ id }, process.env.JWT_SECRET);
before(async () => {
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
function request(path, method = 'GET', body, authorization) {
  return fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
test('public GET and browser preflight allow the React origin', async () => {
  Student.find = () => ({ sort: async () => [{ _id: id, name: 'Ada', major: 'IT', score: 90 }] });
  let res = await request('/api/students');
  assert.equal(res.status, 200);
  assert.equal((await res.json())[0]._id, id);
  assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  res = await fetch(`${base}/api/students`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
  assert.equal(res.status, 204);
  assert.match(res.headers.get('access-control-allow-headers'), /authorization/i);
});
test('POST and DELETE reject missing, invalid and expired JWTs', async () => {
  for (const auth of [undefined, 'Bearer invalid', `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: -1 })}`]) {
    assert.equal((await request('/api/students', 'POST', { name: 'Ada', major: 'IT', score: 90 }, auth)).status, 401);
    assert.equal((await request(`/api/students/${id}`, 'DELETE', undefined, auth)).status, 401);
  }
});
test('protected POST returns a document and DELETE returns an empty 204', async () => {
  Student.create = async data => ({ _id: id, ...data });
  const res = await request('/api/students', 'POST', { name: 'Ada', major: 'IT', score: 90 }, `Bearer ${token}`);
  assert.equal(res.status, 201);
  assert.equal((await res.json())._id, id);
  Student.findByIdAndDelete = async () => ({ _id: id });
  const deleted = await request(`/api/students/${id}`, 'DELETE', undefined, `Bearer ${token}`);
  assert.equal(deleted.status, 204);
  assert.equal(await deleted.text(), '');
  Student.findByIdAndDelete = async () => null;
  assert.equal((await request(`/api/students/${id}`, 'DELETE', undefined, `Bearer ${token}`)).status, 404);
});
test('student schema rejects missing fields and scores outside 0–100', () => {
  for (const score of [-1, 101]) assert.ok(new Student({ name: 'Ada', major: 'IT', score }).validateSync());
  assert.ok(new Student({ name: ' ', major: 'IT', score: 70 }).validateSync());
  assert.equal(new Student({ name: 'Ada', major: 'IT', score: 0 }).validateSync(), undefined);
});
test('register hides password; login verifies bcrypt and issues a JWT', async () => {
  User.create = async data => ({ _id: id, email: data.email, password: 'hidden' });
  let res = await request('/api/auth/register', 'POST', { email: 'student1@example.com', password: 'password123' });
  assert.equal(res.status, 201);
  assert.equal((await res.json()).password, undefined);
  User.findOne = async () => ({ _id: id, password: await bcrypt.hash('password123', 10) });
  res = await request('/api/auth/login', 'POST', { email: 'student1@example.com', password: 'password123' });
  assert.equal(res.status, 200);
  assert.equal(jwt.verify((await res.json()).token, process.env.JWT_SECRET).id, id);
  assert.equal((await request('/api/auth/login', 'POST', { email: 'student1@example.com', password: 'wrong' })).status, 401);
});
test('GET failures and unknown routes produce JSON errors', async () => {
  Student.find = () => ({ sort: async () => { throw new Error('offline'); } });
  assert.equal((await request('/api/students')).status, 500);
  assert.equal((await request('/missing')).status, 404);
});
