// src/routes/emissions.js

import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  getAllEntries, getEntryById, createEntry, updateEntry, deleteEntry,
  getMonthlyData, getBreakdownData, getTotalEmissions, getYearlyComparison,
} from '../controllers/emissionsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All emission routes require authentication
router.use(authenticate);

const VALID_FUEL_TYPES  = ['PETROL','DIESEL','KEROSENE','LNG','CNG','LPG','WOOD','COAL'];
const VALID_WASTE_TYPES = ['LANDFILL','RECYCLED','COMPOSTED','INCINERATED','HAZARDOUS'];

const entryValidation = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Year must be valid'),
  body('electricityKwh').optional().isFloat({ min: 0 }).withMessage('Electricity must be positive'),
  body('fuelQuantity').optional().isFloat({ min: 0 }).withMessage('Fuel quantity must be positive'),
  body('fuelType').optional().isIn(VALID_FUEL_TYPES).withMessage('Invalid fuel type'),
  body('wasteKg').optional().isFloat({ min: 0 }).withMessage('Waste must be positive'),
  body('wasteType').optional().isIn(VALID_WASTE_TYPES).withMessage('Invalid waste type'),
  body('flightKm').optional().isFloat({ min: 0 }).withMessage('Flight km must be positive'),
];

// ── Aggregate endpoints (must come BEFORE /:id) ──

// GET /api/emissions/monthly
router.get('/monthly', getMonthlyData);

// GET /api/emissions/breakdown
router.get('/breakdown', getBreakdownData);

// GET /api/emissions/total
router.get('/total', getTotalEmissions);

// GET /api/emissions/yearly
router.get('/yearly', getYearlyComparison);

// ── CRUD endpoints ──

// GET /api/emissions
router.get('/', getAllEntries);

// POST /api/emissions
router.post('/', entryValidation, validate, createEntry);

// GET /api/emissions/:id
router.get('/:id', getEntryById);

// PUT /api/emissions/:id
router.put(
  '/:id',
  [
    body('electricityKwh').optional().isFloat({ min: 0 }),
    body('fuelQuantity').optional().isFloat({ min: 0 }),
    body('fuelType').optional().isIn(VALID_FUEL_TYPES),
    body('wasteKg').optional().isFloat({ min: 0 }),
    body('wasteType').optional().isIn(VALID_WASTE_TYPES),
    body('flightKm').optional().isFloat({ min: 0 }),
  ],
  validate,
  updateEntry
);

// DELETE /api/emissions/:id
router.delete('/:id', deleteEntry);

export default router;
