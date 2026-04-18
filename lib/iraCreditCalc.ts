export function calculateCredits(gross_cost_usd: number, state_code: string) {
  const federal_tax_credit_usd = gross_cost_usd * 0.30;
  
  const stateRebates: Record<string, number> = {
    'NJ': 1500,
    'NY': 1500,
    'MA': 15000,
    'CA': 3000,
    'IL': 0,
    'GA': 0,
    'TX': 0,
  };

  const state_rebate_usd = stateRebates[state_code] || 0;
  const net_cost_usd = gross_cost_usd - federal_tax_credit_usd - state_rebate_usd;

  return {
    federal_tax_credit_usd,
    state_rebate_usd,
    net_cost_usd
  };
}
