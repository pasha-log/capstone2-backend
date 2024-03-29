const db = require('../db.js');

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
