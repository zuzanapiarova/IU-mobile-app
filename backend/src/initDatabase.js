import fs from "fs";
import { execSync } from "child_process";
import "dotenv/config";

const databasePath = process.env.DATABASE_URL?.replace("file:", "") || "./prisma/dev.db";

export async function initializeDatabase() {
  if (!fs.existsSync(databasePath)) {
    console.log(`Database not found at ${databasePath}. Creating a new database...`);

    try {
      // Run Prisma commands to create and initialize the database
      execSync("npx prisma db push", { stdio: "inherit" });
      console.log("Database created and initialized successfully.");
    } catch (error) {
      console.error("Error initializing the database:", error);
      process.exit(1); // Exit the process if database initialization fails
    }
  } else {
    console.log(`Database already exists at ${databasePath}.`);
  }
}