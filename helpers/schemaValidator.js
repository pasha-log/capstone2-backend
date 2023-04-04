const { BadRequestError } = require('../expressError');
const jsonschema = require('jsonschema');

/**
 * Helper for validating data with JSON schema. Insert this into a route in the "try" block.
 *
 * @param schema {Object} {field1: newVal, field2: newVal, ...}
 * @param requestBody {Object} {field1: val, field2: val, ...}
 *
 * @returns a instance of BadRequestError with an {object} of errors if validation of requestBody according to
 * JSON schema has failed.
 *
 */

const schemaValidator = (requestBody, schema) => {
	const validator = jsonschema.validate(requestBody, schema);
	if (!validator.valid) {
		const errs = validator.errors.map((e) => e.stack);
		throw new BadRequestError(errs);
	}
};

module.exports = { schemaValidator };
