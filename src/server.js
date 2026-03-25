// src/server.js
// Entry point — starts the HTTP server

import 'dotenv/config';
import app from './app.js';
import prisma from './config/database.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log('');
      console.log('🌿 EcoTrack Backend API');
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('Available endpoints:');
      console.log(`  POST   /api/auth/register`);
      console.log(`  POST   /api/auth/login`);
      console.log(`  POST   /api/auth/refresh`);
      console.log(`  POST   /api/auth/logout`);
      console.log(`  GET    /api/auth/me`);
      console.log(`  GET    /api/company/profile`);
      console.log(`  PUT    /api/company/profile`);
      console.log(`  GET    /api/emissions`);
      console.log(`  POST   /api/emissions`);
      console.log(`  GET    /api/emissions/monthly`);
      console.log(`  GET    /api/emissions/breakdown`);
      console.log(`  GET    /api/emissions/total`);
      console.log(`  GET    /api/emissions/yearly`);
      console.log(`  GET    /api/emissions/:id`);
      console.log(`  PUT    /api/emissions/:id`);
      console.log(`  DELETE /api/emissions/:id`);
      console.log(`  GET    /api/reports`);
      console.log(`  GET    /api/reports/history`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
