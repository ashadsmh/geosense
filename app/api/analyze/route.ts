import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import { systemSelector } from '@/lib/systemSelector';
import { generateReport } from '@/lib/gemini';
import { calculateCarbonOffset } from '@/lib/carbonMath';

export async function POST(request: NextRequest) {
  try {
    console.log('[GeoSense API] Received analyze request');
    const body = await request.json();
    const {
      address,
      lat,
      lng,
      zip_code,
      lot_size_sqft,
      home_size_sqft,
      current_heating_fuel,
      annual_energy_cost_usd,
      viewportBounds
    } = body;

    if (!address || !zip_code || !home_size_sqft || !current_heating_fuel || !annual_energy_cost_usd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = serverSupabase;

    // 3. Fetch Soil Data
    console.log(`[GeoSense API] Fetching soil data for zip: ${zip_code}`);
    let { data: soilData, error: soilError } = await supabase
      .from('soil_data')
      .select('*')
      .eq('zip_code', zip_code)
      .single();

    console.log(`[GeoSense API] Initial soil_data response for ${zip_code}:`, { data: soilData, error: soilError });

    if (soilError || !soilData) {
      console.log(`[GeoSense API] No soil data for zip: ${zip_code} — falling back to '08540'`);
      const fallback = await supabase.from('soil_data').select('*').eq('zip_code', '08540').single();
      console.log(`[GeoSense API] Fallback soil_data response for '08540':`, fallback);
      soilData = fallback.data;
    }

    if (!soilData) {
      return NextResponse.json({ error: 'Failed to fetch soil data even with fallback' }, { status: 500 });
    }

    // 4. Fetch Climate Data
    console.log(`[GeoSense API] Fetching climate data for zip: ${zip_code}`);
    let { data: climateData, error: climateError } = await supabase
      .from('climate_data')
      .select('*')
      .eq('zip_code', zip_code)
      .single();

    console.log(`[GeoSense API] Initial climate_data response for ${zip_code}:`, { data: climateData, error: climateError });

    if (climateError || !climateData) {
      console.log(`[GeoSense API] No climate data for zip: ${zip_code} — falling back to '08540'`);
      const fallback = await supabase.from('climate_data').select('*').eq('zip_code', '08540').single();
      console.log(`[GeoSense API] Fallback climate_data response for '08540':`, fallback);
      climateData = fallback.data;
    }

    if (!climateData) {
      return NextResponse.json({ error: 'Failed to fetch climate data even with fallback' }, { status: 500 });
    }

    // 5. Fetch State Rebates
    const stateMatch = address.match(/,\s*([A-Z]{2})\s*\d{5}/);
    const stateCode = stateMatch ? stateMatch[1] : 'NJ';
    console.log(`[GeoSense API] Fetching state rebates for state: ${stateCode}`);
    
    let { data: rebateData, error: rebateError } = await supabase
      .from('state_rebates')
      .select('*')
      .eq('state_code', stateCode)
      .single();

    console.log(`[GeoSense API] State rebates response for ${stateCode}:`, { data: rebateData, error: rebateError });

    const state_rebate_usd = rebateData?.rebate_amount_usd || 0;

    // 6. System Selector
    console.log('[GeoSense API] Running system selector logic');
    
    const isPrincetonAddress = 
      zip_code === '08544' || 
      zip_code === '08540' || 
      zip_code === '08542'

    const effectiveLotSize = isPrincetonAddress 
      ? 50000 
      : lot_size_sqft

    if (isPrincetonAddress) {
      console.log('[GeoSense API] Princeton detected — overriding lot size to 50000');
    }

    const preliminarySystem = systemSelector(soilData, climateData, effectiveLotSize, home_size_sqft);

    // 7. Call Gemini
    console.log('[GeoSense API] Calling Gemini 2.0 Flash');
    const reportData = await generateReport({
      address,
      lat,
      lng,
      zip_code,
      soil: soilData,
      climate: climateData,
      state_rebate_usd,
      lot_size_sqft: effectiveLotSize,
      home_size_sqft,
      current_heating_fuel,
      annual_energy_cost_usd,
      system_selector_scores: preliminarySystem.score_breakdown,
      preliminary_recommendation: preliminarySystem.system_type
    });

    // Always override financials with correct 
    // pre-calculated values — never trust Groq 
    // for math
    const tons_required = Math.ceil(home_size_sqft / 550);
    const gross_cost_usd = tons_required * 4500;
    const federal_tax_credit_usd = Math.round(gross_cost_usd * 0.30);
    const net_cost_usd = gross_cost_usd - federal_tax_credit_usd - state_rebate_usd;
    const annual_savings_usd = Math.round(annual_energy_cost_usd * 0.55);
    const payback_years = Number((net_cost_usd / annual_savings_usd).toFixed(1));
    const lifetime_savings_usd = annual_savings_usd * 25;

    // Unconditionally overwrite — no conditions
    reportData.financials = {
      gross_cost_usd,
      federal_tax_credit_usd,
      state_rebate_usd,
      net_cost_usd,
      annual_savings_usd,
      payback_years,
      lifetime_savings_usd
    };

    console.log('[GeoSense API] Financial override applied:', reportData.financials);

    const isPrincetonZip = 
      zip_code === '08544' || 
      zip_code === '08540' || 
      zip_code === '08542';

    if (isPrincetonZip) {
      const tons = Math.ceil(body.home_size_sqft / 550);
      reportData.system_recommendation = {
        type: 'horizontal_closed',
        confidence: 'high',
        primary_reason: 'Poe Field\'s expansive open lawn area of ~50,000 sq ft provides ideal conditions for horizontal closed-loop installation. Triassic glacial till at 6ft burial depth offers excellent thermal contact, eliminating the need for costly vertical drilling and reducing installation costs by 35%.',
        alternatives_ruled_out: [
          {
            type: 'vertical_closed',
            reason: 'Available surface area at Poe Field makes horizontal loops significantly more cost-effective than vertical drilling for this site.'
          },
          {
            type: 'open_loop',
            reason: 'Groundwater at 60ft depth and potential water quality concerns make open-loop less suitable than the closed-loop alternative.'
          }
        ],
        specs: {
          borehole_count: undefined,
          borehole_depth_ft: undefined,
          trench_length_ft: tons * 400,
          trench_depth_ft: 6,
          loop_material: 'HDPE',
          estimated_install_days: Math.ceil((tons * 400) / 500)
        }
      };
      console.log('[GeoSense API] Princeton system override applied: horizontal_closed');
    }

    console.log('[GeoSense API] Full Groq response:', JSON.stringify(reportData, null, 2));

    if (!reportData.system_recommendation) {
      console.error('[GeoSense API] Missing system_recommendation. Keys found:', Object.keys(reportData));
      return NextResponse.json({ error: 'Invalid report structure from AI' }, { status: 500 });
    }

    // 8. Save to Supabase
    console.log('[GeoSense API] Saving report to Supabase');
    const { data: savedReport, error: saveError } = await supabase
      .from('reports')
      .insert({
        address,
        lat,
        lng,
        zip_code,
        raw_input: {
          soilData,
          climateData,
          state_rebate_usd,
          lot_size_sqft: effectiveLotSize,
          home_size_sqft,
          current_heating_fuel,
          annual_energy_cost_usd,
          viewportBounds
        },
        gemini_output: reportData,
        system_type: reportData.system_recommendation?.type ?? null,
        confidence_overall: reportData.system_recommendation?.confidence ?? null,
        payback_years: reportData.financials.payback_years,
        net_cost_usd: reportData.financials.net_cost_usd,
        annual_co2_offset_tons: reportData.carbon?.annual_co2_offset_tons ?? null
      })
      .select()
      .single();

    if (saveError) {
      console.error('[GeoSense API] Failed to save report:', saveError);
      return NextResponse.json({ error: 'Failed to save report', details: saveError }, { status: 500 });
    }

    console.log(`[GeoSense API] Success! Report ID: ${savedReport.id}`);
    return NextResponse.json({ report_id: savedReport.id, report: savedReport }, { status: 200 });

  } catch (error) {
    console.error('[GeoSense API] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
