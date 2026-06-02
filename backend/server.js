const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`\n🃏  Call Break Scoreboard API`);
  console.log(`   Env  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Port : ${PORT}`);
  console.log(`   Docs : http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  // In production you might want to exit here and let the process manager restart
});
