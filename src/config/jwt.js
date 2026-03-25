// src/config/jwt.js

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-prod',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
