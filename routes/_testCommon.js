'use strict';

const db = require('../db.js');
const { createToken } = require('../helpers/tokens');

async function commonBeforeEach() {
	await db.query('BEGIN');
}

async function commonAfterEach() {
	await db.query('ROLLBACK');
}

async function commonAfterAll() {
	await db.end();
}

const u1Token = createToken({ username: 'u1' });
const u2Token = createToken({ username: 'u2' });

module.exports = {
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u2Token
};
