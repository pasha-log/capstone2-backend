const db = require('../db.js');

// async function commonBeforeAll() {
// 	await db.query('CREATE DATABASE instapost_test');
// 	await db.connect();
// 	await db.query(`\i instapost-schema.sql`);
// }

async function commonBeforeEach() {
	await db.query('BEGIN');
}

async function commonAfterEach() {
	await db.query('ROLLBACK');
}

async function commonAfterAll() {
	await db.end();
	// await db.query('DROP DATABASE instapost_test');
}

module.exports = {
	// commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll
};
