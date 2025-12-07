const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
require("dotenv/config");

// Dynamically set the DATABASE_URL if not already set
if (!process.env.DATABASE_URL) {
  const absolutePath = path.resolve("./prisma/dev.db"); // Resolve to an absolute path
  process.env.DATABASE_URL = `file:${absolutePath}`;
}
const databasePath = process.env.DATABASE_URL.replace("file:", ""); // Extract file path from DATABASE_URL
console.log("DATABASE_URL:", process.env.DATABASE_URL);

async function initializeDatabase() {
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

module.exports = { initializeDatabase };