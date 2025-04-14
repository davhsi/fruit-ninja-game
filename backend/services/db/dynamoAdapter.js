// // services/db/dynamoAdapter.js
// const AWS = require("aws-sdk");

// const dynamoDb = new AWS.DynamoDB.DocumentClient({
//   region: process.env.AWS_REGION || "us-east-1",
// });

// const USERS_TABLE = "Users";
// const MATCHES_TABLE = "Matches";

// async function connect() {
//   // DynamoDB is serverless, no connection needed
//   console.log("✅ DynamoDB ready");
// }

// // Helper: batch get users by IDs
// async function batchGetUsers(userIds) {
//   if (!userIds.length) return {};

//   const keys = userIds.map(id => ({ userId: id }));

//   const params = {
//     RequestItems: {
//       [USERS_TABLE]: {
//         Keys: keys,
//         ProjectionExpression: "userId, username",
//       },
//     },
//   };

//   const result = await dynamoDb.batchGet(params).promise();
//   const users = result.Responses[USERS_TABLE] || [];
//   return Object.fromEntries(users.map(user => [user.userId, user.username]));
// }

// // Save a new match
// async function saveMatch(data) {
//   const params = {
//     TableName: MATCHES_TABLE,
//     Item: data,
//   };
//   await dynamoDb.put(params).promise();
//   return data;
// }

// // Get all matches (optionally paginated)
// async function getMatches(limit = 20, lastEvaluatedKey = null) {
//   const params = {
//     TableName: MATCHES_TABLE,
//     IndexName: "startTime-index", // make sure this GSI exists
//     ScanIndexForward: false, // DESC
//     Limit: limit,
//     ExclusiveStartKey: lastEvaluatedKey || undefined,
//   };

//   const result = await dynamoDb.scan(params).promise();

//   return {
//     items: result.Items || [],
//     nextPageKey: result.LastEvaluatedKey || null,
//   };
// }

// // Get user by email
// async function getUserByEmail(email) {
//   const params = {
//     TableName: USERS_TABLE,
//     IndexName: "email-index", // GSI on email
//     KeyConditionExpression: "email = :email",
//     ExpressionAttributeValues: { ":email": email },
//     Limit: 1,
//   };

//   const result = await dynamoDb.query(params).promise();
//   return result.Items[0] || null;
// }

// // Create a new user
// async function createUser(userData) {
//   const params = {
//     TableName: USERS_TABLE,
//     Item: userData,
//   };

//   await dynamoDb.put(params).promise();
//   return userData;
// }

// // Get match history for a specific user
// async function getMatchHistoryByUser(userId) {
//   // 1. Query matches by userId (needs playersUserId GSI)
//   const params = {
//     TableName: MATCHES_TABLE,
//     IndexName: "playersUserId-index",
//     KeyConditionExpression: "playersUserId = :userId",
//     ExpressionAttributeValues: { ":userId": userId },
//     ScanIndexForward: false, // DESC by startTime
//   };

//   const result = await dynamoDb.query(params).promise();
//   const matches = result.Items || [];

//   // 2. Collect unique userIds
//   const allUserIds = [
//     ...new Set(matches.flatMap(match => match.players.map(p => p.userId))),
//   ];

//   // 3. Batch get user info
//   const userMap = await batchGetUsers(allUserIds);

//   // 4. Enrich matches
//   return matches.map(match => ({
//     ...match,
//     players: match.players.map(p => ({
//       ...p,
//       username: userMap[p.userId] || "Anonymous",
//     })),
//     roomCode: match.roomId,
//     endedAt: match.endTime,
//   }));
// }

// module.exports = {
//   connect,
//   saveMatch,
//   getMatches,
//   getMatchHistoryByUser,
//   getUserByEmail,
//   createUser,
// };
