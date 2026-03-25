// prisma/seed.js
// Seeds the database with demo data for development

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@ecotrack.com' },
    update: {},
    create: {
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@ecotrack.com',
      passwordHash,
      role: 'USER',
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create company profile
  const company = await prisma.company.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      businessName: 'XYZ Traders',
      industryType: 'RETAIL',
      location: 'Nairobi, Kenya',
      country: 'kenya',
      numberOfEmployees: 50,
      registrationNumber: 'BN/2024/12345',
      contactEmail: 'contact@xyztraders.com',
      contactPhone: '+254 712 345 678',
      businessDescription: 'Leading retail business specializing in sustainable consumer goods.',
      yearEstablished: '2019',
    },
  });

  console.log('✅ Created company:', company.businessName);

  // Seed 12 months of emission data
  const currentYear = new Date().getFullYear();
  const monthlyData = [
    { month: 1, electricity: 2100, fuel: 180, waste: 320, flight: 0 },
    { month: 2, electricity: 1950, fuel: 165, waste: 295, flight: 500 },
    { month: 3, electricity: 2300, fuel: 190, waste: 340, flight: 0 },
    { month: 4, electricity: 2050, fuel: 155, waste: 310, flight: 800 },
    { month: 5, electricity: 1900, fuel: 170, waste: 280, flight: 0 },
    { month: 6, electricity: 2200, fuel: 185, waste: 330, flight: 1200 },
    { month: 7, electricity: 2400, fuel: 200, waste: 350, flight: 0 },
    { month: 8, electricity: 2100, fuel: 175, waste: 305, flight: 600 },
    { month: 9, electricity: 1980, fuel: 160, waste: 290, flight: 0 },
    { month: 10, electricity: 2250, fuel: 195, waste: 325, flight: 900 },
    { month: 11, electricity: 2350, fuel: 205, waste: 345, flight: 0 },
    { month: 12, electricity: 2500, fuel: 220, waste: 370, flight: 1500 },
  ];

  // Electricity grid factor for Kenya
  const KENYA_ELECTRICITY_FACTOR = 0.15;
  const DIESEL_FACTOR = 2.68;
  const LANDFILL_FACTOR = 0.58;
  const FLIGHT_SHORT_FACTOR = 0.15;

  for (const data of monthlyData) {
    const scope2 = data.electricity * KENYA_ELECTRICITY_FACTOR;
    const scope1 = data.fuel * DIESEL_FACTOR;
    const scope3Waste = data.waste * LANDFILL_FACTOR;
    const scope3Flight = data.flight * FLIGHT_SHORT_FACTOR;
    const scope3 = scope3Waste + scope3Flight;
    const total = scope1 + scope2 + scope3;

    await prisma.emissionEntry.upsert({
      where: {
        userId_month_year: {
          userId: user.id,
          month: data.month,
          year: currentYear,
        },
      },
      update: {},
      create: {
        userId: user.id,
        companyId: company.id,
        month: data.month,
        year: currentYear,
        electricityKwh: data.electricity,
        fuelType: 'DIESEL',
        fuelQuantity: data.fuel,
        wasteKg: data.waste,
        wasteType: 'LANDFILL',
        flightKm: data.flight,
        scope1Emissions: Math.round(scope1 * 100) / 100,
        scope2Emissions: Math.round(scope2 * 100) / 100,
        scope3Emissions: Math.round(scope3 * 100) / 100,
        totalEmissions: Math.round(total * 100) / 100,
      },
    });
  }

  console.log('✅ Seeded 12 months of emission data');
  console.log('');
  console.log('📋 Demo credentials:');
  console.log('   Email:    demo@ecotrack.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
