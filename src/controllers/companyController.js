// src/controllers/companyController.js

import prisma from '../config/database.js';

// ─── Get company profile ─────────────────────

export const getProfile = async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { userId: req.user.id },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found. Please create one.',
      });
    }

    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// ─── Create or update company profile ────────

export const upsertProfile = async (req, res, next) => {
  try {
    const {
      businessName,
      industryType,
      location,
      country,
      numberOfEmployees,
      registrationNumber,
      contactEmail,
      contactPhone,
      businessDescription,
      yearEstablished,
    } = req.body;

    // Map industryType string to enum safely
    const industryEnum = industryType
      ? industryType.toUpperCase().replace(/\s+/g, '_')
      : 'OTHER';

    const company = await prisma.company.upsert({
      where: { userId: req.user.id },
      update: {
        businessName,
        industryType:       industryEnum,
        location,
        country:            country || 'kenya',
        numberOfEmployees:  numberOfEmployees ? parseInt(numberOfEmployees) : undefined,
        registrationNumber,
        contactEmail,
        contactPhone,
        businessDescription,
        yearEstablished,
      },
      create: {
        userId:             req.user.id,
        businessName,
        industryType:       industryEnum,
        location,
        country:            country || 'kenya',
        numberOfEmployees:  numberOfEmployees ? parseInt(numberOfEmployees) : 1,
        registrationNumber,
        contactEmail,
        contactPhone,
        businessDescription,
        yearEstablished,
      },
    });

    res.json({
      success: true,
      message: 'Company profile saved successfully',
      data: company,
    });
  } catch (error) {
    next(error);
  }
};
