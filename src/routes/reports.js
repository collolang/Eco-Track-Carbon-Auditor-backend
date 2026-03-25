// src/routes/reports.js

import { Router } from 'express';
import { generateReport, getReportHistory } from '../controllers/reportsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/reports?month=March&year=2026
router.get('/', generateReport);

// GET /api/reports/history
router.get('/history', getReportHistory);

export default router;
