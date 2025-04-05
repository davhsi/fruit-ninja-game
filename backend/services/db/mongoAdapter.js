// backend/services/db/mongoAdapter.js
const { v4: uuid } = require("uuid");

const users = []; // Replace with real MongoDB logic later

exports.getUserByEmail = async (email) => users.find(u => u.email === email);

exports.createUser = async ({ email, password, username }) => {
  const user = { id: uuid(), email, password, username };
  users.push(user);
  return user;
};
