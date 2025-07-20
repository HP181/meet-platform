// lib/mongodb.ts
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI as string;
const MONGODB_DB = process.env.MONGODB_DB as string;

// Check the MongoDB URI
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Check the MongoDB DB
if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToDatabase() {
  // If we have the cached connection, return it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // If no connection, connect to the database
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}