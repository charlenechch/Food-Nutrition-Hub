const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  // format.json() is what makes this "Structured"
  format: format.combine(
    format.timestamp(),
    format.json() 
  ),
  defaultMeta: { service: 'food-nutrition-hub' },
  transports: [
    // Logs errors to a specific file
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Logs everything to a combined file
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we are in development, also log to the console with pretty colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    ),
  }));
}

module.exports = logger;