// Local integration check: creates one pending test record and removes only that record.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
require('@next/env').loadEnvConfig(process.cwd());
const base = 'http://localhost:3000';
const marker = 'Temporary local review flow validation ' + randomUUID();
(async () => {
  let collection;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    collection = mongoose.connection.collection('customerreviews');
    assert.equal((await fetch(base + '/api/admin/reviews')).status, 401);
    const invalid = await fetch(base + '/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '', rating: 6, text: 'short', consent: false }) });
    assert.equal(invalid.status, 400);
    const response = await fetch(base + '/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': base }, body: JSON.stringify({ name: 'Local validation test', rating: 4, text: marker, consent: true, website: '' }) });
    assert.equal(response.status, 201, 'Valid review must be saved');
    assert.equal((await response.json()).status, 'pending');
    const record = await collection.findOne({ text: marker });
    assert(record && record.status === 'pending');
    const publicData = await (await fetch(base + '/api/reviews')).json();
    assert(!publicData.reviews.some(r => r.id === record.id), 'Pending review must not be public');
    const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: process.env.HARM_ADMIN_USERNAME, password: process.env.HARM_ADMIN_PASSWORD }) });
    assert.equal(login.status, 200, 'Owner sign-in');
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const admin = await fetch(base + '/api/admin/reviews', { headers: { Cookie: cookie } });
    assert.equal(admin.status, 200);
    const adminData = await admin.json();
    assert(adminData.reviews.some(r => r.id === record.id && r.status === 'pending'));
    assert(!adminData.reviews.some(r => 'clientHash' in r));
    // Reject the synthetic review; never publish test testimonials.
    const moderation = await fetch(base + '/api/admin/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: base }, body: JSON.stringify({ id: record.id, status: 'rejected' }) });
    assert.equal(moderation.status, 200);
    assert.equal((await collection.findOne({ _id: record._id })).status, 'rejected');
    const qrInfo = await (await fetch(base + '/api/review-qr?kind=shop&format=json')).json();
    const target = new URL(qrInfo.url);
    assert.equal(target.pathname, '/reviews');
    assert.equal(target.hash, '#write-review');
    const page = await fetch(qrInfo.url);
    assert.equal(page.status, 200, 'Review QR destination reachable from this computer');
    assert((await page.text()).includes('Submit Review'));
    const image = await fetch(base + '/api/review-qr?kind=shop&download=1');
    assert.equal(image.status, 200);
    assert(image.headers.get('content-disposition').includes('shop-review'));
    console.log('Passed: review submission, pending visibility, owner sign-in/moderation, QR target and review form.');
  } finally {
    if (collection) await collection.deleteOne({ text: marker, name: 'Local validation test' });
    await mongoose.disconnect();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
