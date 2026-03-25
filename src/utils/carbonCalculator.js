// src/utils/carbonCalculator.js
// Server-side emission calculations following GHG Protocol

export const EMISSION_FACTORS = {
  fuel: {
    PETROL:   { factor: 2.31, unit: 'litres' },
    DIESEL:   { factor: 2.68, unit: 'litres' },
    KEROSENE: { factor: 2.52, unit: 'litres' },
    LNG:      { factor: 1.91, unit: 'kg' },
    CNG:      { factor: 2.18, unit: 'kg' },
    LPG:      { factor: 1.51, unit: 'litres' },
    WOOD:     { factor: 1.82, unit: 'kg' },
    COAL:     { factor: 2.42, unit: 'kg' },
  },
  electricity: {
    kenya:       0.15,
    southAfrica: 0.90,
    nigeria:     0.40,
    tanzania:    0.35,
    uganda:      0.10,
    ethiopia:    0.05,
    usa:         0.45,
    uk:          0.25,
    germany:     0.35,
    india:       0.70,
    china:       0.80,
    global:      0.45,
    default:     0.40,
  },
  waste: {
    LANDFILL:    0.58,
    RECYCLED:    0.02,
    COMPOSTED:   0.01,
    INCINERATED: 0.02,
    HAZARDOUS:   0.82,
  },
  flight: {
    shortHaul: 0.15, // per km
    longHaul:  0.12, // per km
    threshold: 1500, // km to distinguish short vs long haul
  },
};

/**
 * Calculate all scopes from an emission entry
 */
export function calculateEmissions(entry, country = 'kenya') {
  // Scope 1: Direct (fuel combustion)
  let scope1 = 0;
  if (entry.fuelQuantity && entry.fuelType) {
    const factor = EMISSION_FACTORS.fuel[entry.fuelType]?.factor ?? 2.68;
    scope1 = entry.fuelQuantity * factor;
  }

  // Scope 2: Purchased electricity
  let scope2 = 0;
  if (entry.electricityKwh) {
    const gridFactor =
      EMISSION_FACTORS.electricity[country.toLowerCase()] ??
      EMISSION_FACTORS.electricity.default;
    scope2 = entry.electricityKwh * gridFactor;
  }

  // Scope 3: Waste + flights
  let scope3 = 0;
  if (entry.wasteKg && entry.wasteType) {
    scope3 += entry.wasteKg * (EMISSION_FACTORS.waste[entry.wasteType] ?? 0.58);
  }
  if (entry.flightKm) {
    const flightFactor =
      entry.flightKm > EMISSION_FACTORS.flight.threshold
        ? EMISSION_FACTORS.flight.longHaul
        : EMISSION_FACTORS.flight.shortHaul;
    scope3 += entry.flightKm * flightFactor;
  }

  const round = (n) => Math.round(n * 100) / 100;

  return {
    scope1Emissions: round(scope1),
    scope2Emissions: round(scope2),
    scope3Emissions: round(scope3),
    totalEmissions:  round(scope1 + scope2 + scope3),
  };
}

/**
 * Calculate green score from total emissions and employees
 */
export function calculateGreenScore(totalEmissions, numberOfEmployees = 1) {
  const perEmployee = totalEmissions / Math.max(numberOfEmployees, 1);

  let score, description;
  if (perEmployee < 50)       { score = 'A'; description = 'Excellent - Environmental leader'; }
  else if (perEmployee < 150) { score = 'B'; description = 'Good - On the right track'; }
  else if (perEmployee < 300) { score = 'C'; description = 'Average - Room for improvement'; }
  else                        { score = 'D'; description = 'Poor - Significant improvement needed'; }

  return {
    score,
    description,
    emissionsPerEmployee: Math.round(perEmployee * 10) / 10,
  };
}

/**
 * Generate recommendations based on emission breakdown
 */
export function generateRecommendations(breakdown, greenScore) {
  const recs = [];

  if ((breakdown.electricity || 0) > 200) {
    recs.push({
      category: 'Electricity',
      priority: 'high',
      suggestion: 'Install solar panels or switch to a renewable energy provider',
      potentialReduction: '30-60%',
    });
  }

  if ((breakdown.fuel || 0) > 300) {
    recs.push({
      category: 'Fuel',
      priority: 'high',
      suggestion: 'Consider switching to electric or hybrid vehicles',
      potentialReduction: '20-40%',
    });
  }

  if ((breakdown.waste || 0) > 150) {
    recs.push({
      category: 'Waste',
      priority: 'medium',
      suggestion: 'Implement a recycling and composting program',
      potentialReduction: '20-30%',
    });
  }

  if ((breakdown.flights || 0) > 100) {
    recs.push({
      category: 'Business Travel',
      priority: 'medium',
      suggestion: 'Replace short-haul flights with virtual meetings or train travel',
      potentialReduction: '20-40%',
    });
  }

  if (greenScore?.score === 'D') {
    recs.push({
      category: 'Overall',
      priority: 'high',
      suggestion: 'Consider a comprehensive environmental audit',
      potentialReduction: '30-50%',
    });
  }

  const order = { high: 1, medium: 2, low: 3 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}
