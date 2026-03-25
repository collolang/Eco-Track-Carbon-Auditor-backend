// src/controllers/authController.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { jwtConfig } from '../config/jwt.js';

// ─── Helpers ─────────────────────────────────

function generateAccessToken(userId, role) {
  return jwt.sign({ userId, role }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
}

function getRefreshExpiry() {
  const days = parseInt(jwtConfig.refreshExpiresIn) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// ─── Register ────────────────────────────────

export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if email taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { firstName, lastName, email, passwordHash },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });

    const accessToken  = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token:     refreshToken,
        userId:    user.id,
        expiresAt: getRefreshExpiry(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ───────────────────────────────────

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const accessToken  = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token:     refreshToken,
        userId:    user.id,
        expiresAt: getRefreshExpiry(),
      },
    });

    const { passwordHash, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user:         safeUser,
        accessToken,
        refreshToken,
        hasCompany:   !!user.company,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh Token ───────────────────────────

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.refreshSecret);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Check token exists in DB and is not expired
    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Refresh token expired or revoked' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Rotate: delete old, issue new
    await prisma.refreshToken.delete({ where: { token } });

    const newAccessToken  = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token:     newRefreshToken,
        userId:    user.id,
        expiresAt: getRefreshExpiry(),
      },
    });

    res.json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ──────────────────────────────────

export const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Get current user ────────────────────────

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id:        true,
        firstName: true,
        lastName:  true,
        email:     true,
        role:      true,
        createdAt: true,
        company:   true,
      },
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};
