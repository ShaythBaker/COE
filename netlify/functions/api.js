const serverless = require("serverless-http");
const app = require("../../backend/src/server");

exports.handler = serverless(app);