const path = require('path');

const env = {
  port: process.env.PORT || 3005,
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, '../../data.sqlite'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  encryptionSecret: process.env.APP_ENCRYPTION_KEY || 'dev-32-char-encryption-key!!!',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!',
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3005']
};

module.exports = env;