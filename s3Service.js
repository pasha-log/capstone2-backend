const { S3 } = require('aws-sdk');
require('dotenv').config();
const uuid = require('uuid').v4;

exports.s3Uploadv2 = async (file) => {
	const s3 = new S3();
	console.log(process.env.AWS_ACCESS_KEY_ID);
	const param = {
		Bucket: process.env.AWS_BUCKET,
		Key: `uploads/${uuid()}-${file.originalname}`,
		Body: file.buffer
	};
	return await s3.upload(param).promise();
};
