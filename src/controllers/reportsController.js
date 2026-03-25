// src/controllers/reportsController.js

import prisma from '../config/database.js';
import { calculateGreenScore, generateRecommendations } from '../utils/carbonCalculator.js';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ─── Generate Report ─────────────────────────

export const generateReport = async (req, res, next) => {
  try {
    const monthName = req.query.month || MONTH_NAMES[new Date().getMonth()];
    const year      = parseInt(req.query.year) || new Date().getFullYear();
    const monthNum  = MONTH_NAMES.indexOf(monthName) + 1 || new Date().getMonth() + 1;

    // Fetch the emission entry for this period
    const entry = await prisma.emissionEntry.findFirst({
      where: { userId: req.user.id, month: monthNum, year },
    });

    // Fetch company
    const company = await prisma.company.findUnique({
      where: { userId: req.user.id },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: `No emission data found for ${monthName} ${year}. Please add data first.`,
      });
    }

    const greenScore = calculateGreenScore(
      entry.totalEmissions,
      company?.numberOfEmployees || 1
    );

    const breakdown = {
      electricity: entry.scope2Emissions,
      fuel:        entry.scope1Emissions,
      waste:       entry.scope3Emissions * 0.7, // approximate waste portion
      flights:     entry.scope3Emissions * 0.3, // approximate flight portion
    };

    const recommendations = generateRecommendations(breakdown, greenScore);

    const report = {
      period:    `${monthName} ${year}`,
      company:   company ? {
        name:        company.businessName,
        industry:    company.industryType,
        location:    company.location,
        employees:   company.numberOfEmployees,
      } : null,
      emissions: {
        total: {
          amount: entry.totalEmissions,
          unit:   'kg CO₂e',
        },
        electricity: {
          amount:  entry.scope2Emissions,
          kwh:     entry.electricityKwh,
          unit:    'kg CO₂e',
          scope:   2,
        },
        transport: {
          amount:  entry.scope1Emissions,
          litres:  entry.fuelQuantity,
          fuelType: entry.fuelType,
          unit:    'kg CO₂e',
          scope:   1,
        },
        waste: {
          amount:  entry.scope3Emissions,
          kg:      entry.wasteKg,
          type:    entry.wasteType,
          unit:    'kg CO₂e',
          scope:   3,
        },
      },
      greenScore,
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// ─── Get report history ──────────────────────

export const getReportHistory = async (req, res, next) => {
  try {
    const entries = await prisma.emissionEntry.findMany({
      where: { userId: req.user.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      select: {
        id:             true,
        month:          true,
        year:           true,
        totalEmissions: true,
        createdAt:      true,
      },
    });

    const history = entries.map((e) => ({
      id:            e.id,
      period:        `${MONTH_NAMES[e.month - 1]} ${e.year}`,
      month:         e.month,
      year:          e.year,
      totalEmissions: e.totalEmissions,
      createdAt:     e.createdAt,
    }));

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
