
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI; 
let client;
let db;

async function connectToMongo() {
  if (!uri) {
    throw new Error("MONGO_URI not defined in .env");
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(); 
    console.log("MongoDB working");
  } catch (err) {
    console.error("[DB ERROR] Failed to connect:", err);
    throw err;
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not connected. Call connectToMongo() first.");
  }
  return db;
}

async function closeDb() {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

module.exports = { connectToMongo, getDb, closeDb };
