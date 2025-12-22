import "reflect-metadata";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 
  "mongodb+srv://oem_teste:Compincha_123@clusterlapr5.waiyfrz.mongodb.net/oem_test";

process.env.MONGODB_URI = TEST_DB_URI;
process.env.NODE_ENV = 'test';

import loaders from "../../src/loaders";

const ALLOWED_TEST_DATABASES = ["oem_test"];

function validateTestDatabase() {
  const dbName = mongoose.connection.db?.databaseName;
  
  if (!dbName) {
    throw new Error(" DATABASE NAME NOT FOUND - Cannot proceed with tests");
  }

  if (!ALLOWED_TEST_DATABASES.includes(dbName)) {
    throw new Error(
      ` SAFETY CHECK FAILED!\n` +
      `  Current database: "${dbName}"\n` +
      `  Allowed databases: ${ALLOWED_TEST_DATABASES.join(", ")}\n` +
      ` Tests can ONLY run on dedicated test databases!\n` +
      `  Please check your TEST_DB_URI configuration.`
    );
  }

}

export async function createSystemApp() {
  const app = express();
  app.use(bodyParser.json());

  await loaders({ expressApp: app });

  validateTestDatabase();

  return app;
}

export async function clearDatabase() {
  validateTestDatabase();
  
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

export async function closeDatabase() {
  validateTestDatabase();
  
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
    validateTestDatabase();
  }
}

