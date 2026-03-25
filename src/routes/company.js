// src/routes/company.js

import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, upsertProfile } from '../controllers/companyController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All company routes require authentication
router.use(authenticate);

// GET /api/company/profile
router.get('/profile', getProfile);

// PUT /api/company/profile  (create or update)
router.put(
  '/profile',
  [
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('numberOfEmployees')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Number of employees must be a positive integer'),
    body('contactEmail')
      .optional()
      .isEmail()
      .withMessage('Contact email must be valid'),
  ],
  validate,
  upsertProfile
);

export default router;
