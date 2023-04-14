'use strict';

const request = require('supertest');

const app = require('../app');

const User = require('../models/user');

const { commonBeforeEach, commonAfterEach, commonAfterAll } = require('./_testCommon');

beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /auth/token */

describe('POST /auth/token', function() {
	test('works', async function() {
		await User.register({
			username: 'u1',
			fullName: 'U1FN',
			email: 'user1@user.com',
			password: 'password1'
		});
		const resp = await request(app).post('/auth/token').send({
			username: 'u1',
			password: 'password1'
		});
		expect(resp.body).toEqual({
			token: expect.any(String)
		});
	});

	test('unauth with non-existent user', async function() {
		const resp = await request(app).post('/auth/token').send({
			username: 'no-such-user',
			password: 'password1'
		});
		expect(resp.statusCode).toEqual(401);
	});

	test('unauth with wrong password', async function() {
		await User.register({
			username: 'u1',
			fullName: 'U1FN',
			email: 'user1@user.com',
			password: 'password1'
		});
		const resp = await request(app).post('/auth/token').send({
			username: 'u1',
			password: 'nope'
		});
		expect(resp.statusCode).toEqual(401);
	});

	test('bad request with missing data', async function() {
		await User.register({
			username: 'u1',
			fullName: 'U1FN',
			email: 'user1@user.com',
			password: 'password1'
		});
		const resp = await request(app).post('/auth/token').send({
			username: 'u1'
		});
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request with invalid data', async function() {
		const resp = await request(app).post('/auth/token').send({
			username: 42,
			password: 'above-is-a-number'
		});
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** POST /auth/register */

describe('POST /auth/register', function() {
	test('works for anon', async function() {
		const resp = await request(app).post('/auth/register').send({
			username: 'new',
			fullName: 'full-name',
			password: 'password',
			email: 'new@email.com'
		});
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			token: expect.any(String)
		});
	});

	test('bad request with missing fields', async function() {
		const resp = await request(app).post('/auth/register').send({
			username: 'new'
		});
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request with invalid data', async function() {
		const resp = await request(app).post('/auth/register').send({
			username: 'new',
			fullName: 'full-name',
			password: 'password',
			email: 'not-an-email'
		});
		expect(resp.statusCode).toEqual(400);
	});
});
