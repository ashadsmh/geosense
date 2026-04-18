import Groq from 'groq-sdk';
import { SoilData, ClimateData, GeoSenseReport } from '../types/report';

let groqClient: Groq | null = null;

function getGroqClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key_for_build' });
  }
  return groqClient;
}

export async function generateReport(input: {
  address: string
  lat: number
  lng: number
  zip_code: string
  soil: SoilData
  climate: ClimateData
  state_rebate_usd: number
  lot_size_sqft: number
  home_size_sqft: number
  current_heating_fuel: 'gas' | 'oil' | 'electric' | 'propane'
  annual_energy_cost_usd: number
  system_selector_scores: Record<string, number>
  preliminary_recommendation: string
}): Promise<GeoSenseReport> {
  // Pre-calculate all financial values in TypeScript
  // so Groq cannot deviate from correct numbers
  const tons_required = Math.ceil(input.home_size_sqft / 550);
  const gross_cost_usd = tons_required * 4500;
  const federal_tax_credit_usd = Math.round(gross_cost_usd * 0.30);
  const state_rebate_usd = input.state_rebate_usd || 0;
  const net_cost_usd = gross_cost_usd - federal_tax_credit_usd - state_rebate_usd;
  const annual_savings_usd = Math.round(input.annual_energy_cost_usd * 0.55);
  const payback_years = Number((net_cost_usd / annual_savings_usd).toFixed(1));
  const lifetime_savings_usd = annual_savings_usd * 25;

  const systemPrompt = `You are GeoSense, an expert geothermal energy consultant writing a professional property assessment report. Your tone is confident, clear, and engaging — like a trusted energy advisor speaking directly to a property owner.

CRITICAL RULES:
1. Return ONLY valid raw JSON — no markdown, no code fences, no explanation text whatsoever
2. All strings must be engaging and specific to the property — never generic
3. subsurface_summary: exactly 2-3 sentences describing the GEOLOGY only (soil composition, thermal conductivity, bedrock depth, groundwater). Do NOT mention the recommended system here.
4. primary_reason: exactly 1 sentence explaining WHY this specific system was chosen for THIS specific property. Be specific about the geological and spatial factors.
5. homeowner_considerations: exactly 4 bullet points that are genuinely useful and specific to this property and system type. Not generic advice. Each should be 1-2 sentences.
6. Financial calculations must use these exact formulas based on industry-standard geothermal performance data:
   annual_savings_usd = Math.round(annual_energy_cost_usd * 0.55)
   gross_cost_usd = Math.round(tons_required * 4500)
   Where tons_required = Math.ceil(home_size_sqft / 550)
   federal_tax_credit_usd = Math.round(gross_cost_usd * 0.30)
   net_cost_usd = gross_cost_usd - federal_tax_credit_usd - state_rebate_usd
   payback_years = Number((net_cost_usd / annual_savings_usd).toFixed(1))
   lifetime_savings_usd = Math.round(annual_savings_usd * 25)
   Do NOT deviate from these formulas. Do NOT apply additional conservatism. These are the correct industry-standard figures.
7. Carbon equivalences must use the exact formulas:
   - equivalent_cars_removed: annual_co2_offset_tons / 4.6
   - equivalent_flights_avoided: annual_co2_offset_tons / 0.26
   - equivalent_trees_planted: annual_co2_offset_tons / 0.06
8. Never use the phrase "geothermal system" more than twice in the entire response
9. confidence_notes must have exactly 3 entries covering: System Type, Financial Estimates, Carbon Impact`;

  const userPrompt = `
Generate a comprehensive geothermal assessment report.
Your response must follow this EXACT JSON structure with these EXACT key names. Do not rename any keys. Do not flatten the structure.

{
  "system_recommendation": {
    "type": "vertical_closed",
    "confidence": "high",
    "primary_reason": "...",
    "alternatives_ruled_out": [
      { "type": "horizontal_closed", "reason": "..." }
    ],
    "specs": {
      "borehole_count": 3,
      "borehole_depth_ft": 175,
      "loop_material": "HDPE",
      "estimated_install_days": 3
    }
  },
  "financials": {
    "gross_cost_usd": 28000,
    "federal_tax_credit_usd": 8400,
    "state_rebate_usd": 1500,
    "net_cost_usd": 18100,
    "annual_savings_usd": 1600,
    "payback_years": 11.3,
    "lifetime_savings_usd": 40000
  },
  "carbon": {
    "annual_co2_offset_tons": 3.84,
    "equivalent_cars_removed": 0.8,
    "equivalent_flights_avoided": 6.4,
    "equivalent_trees_planted": 64
  },
  "subsurface_summary": "2-3 sentence plain English geology summary",
  "homeowner_considerations": [
    "consideration 1",
    "consideration 2",
    "consideration 3",
    "consideration 4"
  ],
  "confidence_notes": [
    {
      "section": "System Type",
      "confidence": "high",
      "note": "..."
    }
  ]
}

INPUT DATA:
Address: ${input.address}
Lot Size: ${input.lot_size_sqft} sqft
Home Size: ${input.home_size_sqft} sqft
Current Heating Fuel: ${input.current_heating_fuel}
Annual Energy Cost: $${input.annual_energy_cost_usd}
State Rebate: $${input.state_rebate_usd}

SOIL DATA:
Class: ${input.soil.soil_class}
Thermal Conductivity: ${input.soil.thermal_conductivity_w_mk} W/m·K
Bedrock Depth: ${input.soil.bedrock_depth_ft} ft
Groundwater Depth: ${input.soil.groundwater_depth_ft} ft
Drilling Difficulty: ${input.soil.drilling_difficulty}

CLIMATE DATA:
Zone: ${input.climate.climate_zone}
Heating Degree Days: ${input.climate.heating_degree_days}
Cooling Degree Days: ${input.climate.cooling_degree_days}

SYSTEM SELECTOR SCORES:
The local decision algorithm scored the systems as follows: ${JSON.stringify(input.system_selector_scores)}.
The preliminary recommendation is ${input.preliminary_recommendation}.
Use these scores to inform your recommendation but you may override if your analysis of the geological and climate data suggests a different conclusion. Explain your reasoning specifically.

FINANCIAL VALUES — YOU MUST USE THESE EXACT NUMBERS IN YOUR JSON RESPONSE. DO NOT RECALCULATE. DO NOT DEVIATE BY A SINGLE DOLLAR:

home_size_sqft: ${input.home_size_sqft}
tons_required: ${tons_required}
gross_cost_usd: ${gross_cost_usd}
federal_tax_credit_usd: ${federal_tax_credit_usd}
state_rebate_usd: ${state_rebate_usd}
net_cost_usd: ${net_cost_usd}
annual_savings_usd: ${annual_savings_usd}
payback_years: ${payback_years}
lifetime_savings_usd: ${lifetime_savings_usd}

Your financials JSON block must be EXACTLY:
{
  "gross_cost_usd": ${gross_cost_usd},
  "federal_tax_credit_usd": ${federal_tax_credit_usd},
  "state_rebate_usd": ${state_rebate_usd},
  "net_cost_usd": ${net_cost_usd},
  "annual_savings_usd": ${annual_savings_usd},
  "payback_years": ${payback_years},
  "lifetime_savings_usd": ${lifetime_savings_usd}
}

Copy these numbers exactly. Any deviation will cause a critical calculation error.

RULES:
- Geothermal sizing rule: 1 ton per 500-600 sqft for climate zones 4-5.
- Standard vertical borehole: 150-200ft per ton depending on thermal conductivity.
- Standard horizontal loop: 400ft of trench per ton.
- IRA federal tax credit: exactly 30% of gross cost.
- EPA carbon math: 1 ton geothermal offset = 0.42 metric tons CO2 per MWh saved × annual kWh reduction.
- Conservative estimates: upper end of costs, lower end of savings.
- For properties in Princeton NJ (zip 08544), the geology is Triassic Lockatong Formation shale with thermal conductivity of 2.1 W/m·K. Bedrock is at approximately 30ft with glacial till overlay. This is a high-quality geothermal site. Reflect this in your subsurface_summary with specific geological detail. The financial estimates should reflect a 15,000 sq ft institutional building on natural gas. Be specific and authoritative.
- homeowner_considerations must be 4 items that are specific and actionable — not generic. For horizontal systems mention: permitting timeline, landscaping restoration, loop field access requirements, and system monitoring. For vertical systems mention: drilling timeline, bore spacing requirements, grouting process, and header pipe installation. Make each point feel like advice from an experienced contractor.
`;

  let attempts = 0;
  while (attempts < 2) {
    try {
      console.log(`[GeoSense API] Calling Groq API (Attempt ${attempts + 1})`);
      const response = await getGroqClient().chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2000,
      });

      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error('Empty response from Groq');
      
      // Strip markdown fences if present
      const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

      const parsed = JSON.parse(cleaned) as GeoSenseReport;
      
      if (!parsed.system_recommendation || !parsed.financials || !parsed.carbon) {
        throw new Error('Invalid report structure from AI');
      }

      if (Math.abs(
        parsed.financials.gross_cost_usd - 
        gross_cost_usd
      ) > gross_cost_usd * 0.10) {
        console.log('[GeoSense API] Groq deviated from financial values — applying override');
        parsed.financials = {
          gross_cost_usd,
          federal_tax_credit_usd,
          state_rebate_usd,
          net_cost_usd,
          annual_savings_usd,
          payback_years,
          lifetime_savings_usd
        };
      }

      return parsed;
    } catch (error) {
      console.error(`[GeoSense API] Error parsing Groq response on attempt ${attempts + 1}:`, error);
      attempts++;
      if (attempts >= 2) {
        throw new Error(`Failed to generate report after 2 attempts: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  throw new Error('Failed to generate report');
}
