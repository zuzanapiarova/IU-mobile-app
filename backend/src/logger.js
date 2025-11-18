const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, json } = format;

const LOG_LEVEL = process.env.LOG_LEVEL || "info"; 
// e.g. "debug", "info", "warn", "error", "silent"

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
    // ALWAYS log to a file
    new transports.File({
      filename: "server.log",
      level: "debug", // capture ALL logs
      maxsize: 5_000_000,  // optional 5MB rotation
      maxFiles: 5
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
