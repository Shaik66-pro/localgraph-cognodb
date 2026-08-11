require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const app = require('./app');
const { verifyConnection, closeDriver } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('🚀 Initializing LocalGraph Express Server...');
  console.log('⚡ Verifying CognoDB Cloud Connection...');

  const connected = await verifyConnection();
  if (connected) {
    console.log('✅ Connected to CognoDB Cloud Graph Database.');
  } else {
    console.warn('⚠️ Could not connect to CognoDB Cloud on boot. API will return 503 fallback responses until connection recovers.');
  }

  const server = app.listen(PORT, () => {
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api/health`);
  });

  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down server gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await closeDriver();
      console.log('CognoDB driver connections closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});
