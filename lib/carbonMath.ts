export function calculateCarbonOffset(annual_kwh_saved: number, state_code: string) {
  // EPA eGRID regional factors (lb CO2/kWh)
  const egridFactors: Record<string, number> = {
    'NJ': 0.52,
    'NY': 0.25,
    'MA': 0.65,
    'CA': 0.45,
    'IL': 0.85,
    'GA': 0.95,
    'TX': 0.90,
  };

  const factor = egridFactors[state_code] || 0.85; // US Average fallback
  
  // Convert lbs to metric tons (1 metric ton = 2204.62 lbs)
  const annual_co2_offset_tons = (annual_kwh_saved * factor) / 2204.62;

  return {
    annual_co2_offset_tons,
    equivalent_cars_removed: annual_co2_offset_tons / 4.6,
    equivalent_flights_avoided: annual_co2_offset_tons / 0.6,
    equivalent_trees_planted: annual_co2_offset_tons / 0.06
  };
}
