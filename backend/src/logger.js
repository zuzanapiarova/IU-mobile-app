const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, json } = format;
const fs = require('fs');
const path = require('path');

// "debug", "info", "warn", "error", "silent"
const LOG_LEVEL = process.env.LOG_LEVEL || "info"; 

// Ensure log directory exists
const logDir = path.resolve(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return stack
    ? `${timestamp} ${level}: ${message} - ${stack}`
    : `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  level: LOG_LEVEL,
  format: combine(
    timestamp(),
    format.errors({ stack: true }),
    json()
  ),
  transports: [
    new transports.File({
      filename: path.join(logDir, 'server.log'), // logs stored in folder
      level: "debug", // capture ALL logs
      maxsize: 5_000_000  // optional 5MB rotation
    })
  ],
});

// Log to console ONLY if LOG_LEVEL is not "silent"
if (LOG_LEVEL !== "silent") {
  logger.add(
    new transports.Console({
      format: combine(timestamp(), logFormat)
    })
  );
}

module.exports = logger;