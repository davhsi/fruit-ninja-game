// backend/services/db/dbService.js
const useDynamo = process.env.DB_TYPE === "dynamo";
const dynamo = require("./dynamoAdapter");
const mongo = require("./mongoAdapter");

const db = useDynamo ? dynamo : mongo;

module.exports = {
  init: db.connect,
  saveMatch: db.saveMatch,
  getMatches: db.getMatches,
};
