// src/controllers/emissionsController.js

import prisma from '../config/database.js';
import { calculateEmissions, calculateGreenScore, generateRecommendations } from '../utils/carbonCalculator.js';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Get all entries ─────────────────────────

export const getAllEntries = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    const where = { userId: req.user.id };
    if (month) where.month = parseInt(month);
    if (year)  where.year  = parseInt(year);

    const entries = await prisma.emissionEntry.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
};

// ─── Get single entry ────────────────────────

export const getEntryById = async (req, res, next) => {
  try {
    const entry = await prisma.emissionEntry.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// ─── Create entry ────────────────────────────

export const createEntry = async (req, res, next) => {
  try {
    const { month, year, electricityKwh, fuelType, fuelQuantity,
            wasteKg, wasteType, flightKm, notes } = req.body;

    // Get company to determine country for grid factor
    const company = await prisma.company.findUnique({
      where: { userId: req.user.id },
    });

    const calculated = calculateEmissions(
      { electricityKwh, fuelType, fuelQuantity, wasteKg, wasteType, flightKm },
      company?.country || 'kenya'
    );

    const entry = await prisma.emissionEntry.create({
      data: {
        userId:       req.user.id,
        companyId:    company?.id,
        month:        parseInt(month),
        year:         parseInt(year),
        electricityKwh: electricityKwh ? parseFloat(electricityKwh) : null,
        fuelType:     fuelType || null,
        fuelQuantity: fuelQuantity ? parseFloat(fuelQuantity) : null,
        wasteKg:      wasteKg ? parseFloat(wasteKg) : null,
        wasteType:    wasteType || 'LANDFILL',
        flightKm:     flightKm ? parseFloat(flightKm) : null,
        notes,
        ...calculated,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Emission entry created successfully',
      data: entry,
    });
  } catch (error) {
    // Handle unique constraint (one entry per month/year)
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: `An entry already exists for this month/year. Use PUT to update it.`,
      });
    }
    next(error);
  }
};

// ─── Update entry ────────────────────────────

export const updateEntry = async (req, res, next) => {
  try {
    const existing = await prisma.emissionEntry.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    const { electricityKwh, fuelType, fuelQuantity,
            wasteKg, wasteType, flightKm, notes } = req.body;

    const company = await prisma.company.findUnique({ where: { userId: req.user.id } });

    const merged = {
      electricityKwh: electricityKwh ?? existing.electricityKwh,
      fuelType:       fuelType       ?? existing.fuelType,
      fuelQuantity:   fuelQuantity   ?? existing.fuelQuantity,
      wasteKg:        wasteKg        ?? existing.wasteKg,
      wasteType:      wasteType      ?? existing.wasteType,
      flightKm:       flightKm       ?? existing.flightKm,
    };

    const calculated = calculateEmissions(merged, company?.country || 'kenya');

    const entry = await prisma.emissionEntry.update({
      where: { id: req.params.id },
      data: {
        electricityKwh: merged.electricityKwh ? parseFloat(merged.electricityKwh) : null,
        fuelType:       merged.fuelType || null,
        fuelQuantity:   merged.fuelQuantity ? parseFloat(merged.fuelQuantity) : null,
        wasteKg:        merged.wasteKg ? parseFloat(merged.wasteKg) : null,
        wasteType:      merged.wasteType || 'LANDFILL',
        flightKm:       merged.flightKm ? parseFloat(merged.flightKm) : null,
        notes:          notes ?? existing.notes,
        ...calculated,
      },
    });

    res.json({ success: true, message: 'Entry updated successfully', data: entry });
  } catch (error) {
    next(error);
  }
};

// ─── Delete entry ────────────────────────────

export const deleteEntry = async (req, res, next) => {
  try {
    const entry = await prisma.emissionEntry.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    await prisma.emissionEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Monthly chart data ──────────────────────

export const getMonthlyData = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const entries = await prisma.emissionEntry.findMany({
      where: { userId: req.user.id, year },
      orderBy: { month: 'asc' },
      select: { month: true, totalEmissions: true, scope1Emissions: true,
                scope2Emissions: true, scope3Emissions: true },
    });

    // Fill all 12 months (zero for missing months)
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const found = entries.find((e) => e.month === i + 1);
      return {
        month:     MONTH_NAMES[i],
        emissions: found?.totalEmissions  || 0,
        scope1:    found?.scope1Emissions || 0,
        scope2:    found?.scope2Emissions || 0,
        scope3:    found?.scope3Emissions || 0,
        target:    500, // Can be made configurable per company
      };
    });

    res.json({ success: true, data: monthly });
  } catch (error) {
    next(error);
  }
};

// ─── Breakdown (pie chart) ───────────────────

export const getBreakdownData = async (req, res, next) => {
  try {
    const year  = parseInt(req.query.year)  || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const entry = await prisma.emissionEntry.findFirst({
      where: { userId: req.user.id, year, month },
    });

    if (!entry) {
      return res.json({
        success: true,
        data: [
          { name: 'Electricity', value: 0, percentage: 0, color: '#10b981' },
          { name: 'Fuel',        value: 0, percentage: 0, color: '#3b82f6' },
          { name: 'Waste',       value: 0, percentage: 0, color: '#f59e0b' },
        ],
      });
    }

    const total = entry.totalEmissions || 1;
    const breakdown = [
      {
        name:       'Electricity',
        value:      entry.scope2Emissions,
        percentage: Math.round((entry.scope2Emissions / total) * 100),
        color:      '#10b981',
      },
      {
        name:       'Fuel',
        value:      entry.scope1Emissions,
        percentage: Math.round((entry.scope1Emissions / total) * 100),
        color:      '#3b82f6',
      },
      {
        name:       'Waste & Travel',
        value:      entry.scope3Emissions,
        percentage: Math.round((entry.scope3Emissions / total) * 100),
        color:      '#f59e0b',
      },
    ];

    res.json({ success: true, data: breakdown });
  } catch (error) {
    next(error);
  }
};

// ─── Total emissions (current month) ─────────

export const getTotalEmissions = async (req, res, next) => {
  try {
    const now = new Date();
    const entry = await prisma.emissionEntry.findFirst({
      where: {
        userId: req.user.id,
        month:  now.getMonth() + 1,
        year:   now.getFullYear(),
      },
      select: { totalEmissions: true },
    });

    res.json({ success: true, data: entry?.totalEmissions || 0 });
  } catch (error) {
    next(error);
  }
};

// ─── Yearly comparison (bar chart) ──────────

export const getYearlyComparison = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();

    const results = await prisma.$queryRaw`
      SELECT year, SUM("totalEmissions") as total
      FROM emission_entries
      WHERE "userId" = ${req.user.id}
        AND year >= ${currentYear - 3}
      GROUP BY year
      ORDER BY year ASC
    `;

    const formatted = results.map((r) => ({
      year:      r.year.toString(),
      emissions: Math.round(parseFloat(r.total) * 100) / 100,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};
