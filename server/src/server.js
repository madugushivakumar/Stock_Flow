const { PORT, NODE_ENV } = require('./config/env');
const app = require('./app');
const prisma = require('./config/db');

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  StockFlow API Server is running on port ${PORT}`);
  console.log(`  Environment: ${NODE_ENV}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

module.exports = server;
