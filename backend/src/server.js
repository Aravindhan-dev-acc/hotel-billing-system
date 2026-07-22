const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const seed = require('./db/seed');
const { startScheduler } = require('./utils/scheduler');

// Seed default data on first boot (idempotent - safe to run every start)
seed();

const server = app.listen(config.port, () => {
  logger.info(`Hotel Billing backend running on http://localhost:${config.port} [${config.env}]`);
  startScheduler();
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err.message}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully.');
  server.close(() => process.exit(0));
});

module.exports = server;
