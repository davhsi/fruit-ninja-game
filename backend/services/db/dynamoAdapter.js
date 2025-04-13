// backend/services/db/dynamoAdapter.js
const { DynamoDBClient, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuid } = require("uuid");

const client = new DynamoDBClient({ region: "us-east-1" });
const TABLE_NAME = "FruitNinjaUsers";

exports.getUserByEmail = async (email) => {
  const command = new GetItemCommand({
    TableName: TABLE_NAME,
    Key: { email: { S: email } }
  });

  const result = await client.send(command);
  if (!result.Item) return null;

  return {
    id: result.Item.id.S,
    email: result.Item.email.S,
    password: result.Item.password.S,
    username: result.Item.username.S
  };
};
async function getMatchesForUser(userId) {
  // TODO: Implement this for DynamoDB
  return [];
}

exports.createUser = async ({ email, password, username }) => {
  const user = {
    id: uuid(),
    email,
    password,
    username
  };

  const command = new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      id: { S: user.id },
      email: { S: user.email },
      password: { S: user.password },
      username: { S: user.username }
    }
  });

  await client.send(command);
  return user;
};
