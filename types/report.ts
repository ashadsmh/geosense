export interface SoilData {
  zip_code: string
  county: string
  state: string
  soil_class: string
  thermal_conductivity_w_mk: number
  bedrock_depth_ft: number
  groundwater_depth_ft: number
  drilling_difficulty: 'easy' | 'moderate' | 'hard' | 'very_hard'
  usgs_notes: string
}

export interface ClimateData {
  zip_code: string
  climate_zone: string
  heating_degree_days: number
  cooling_degree_days: number
  avg_ground_temp_f: number
  noaa_station_id: string
}

export interface GeoSenseReport {
  system_recommendation: {
    type: 'horizontal_closed' | 'vertical_closed' | 'open_loop' | 'pond_lake'
    confidence: 'high' | 'medium' | 'low'
    primary_reason: string
    alternatives_ruled_out: { type: string; reason: string }[]
    specs: {
      borehole_count?: number
      borehole_depth_ft?: number
      trench_length_ft?: number
      trench_depth_ft?: number
      loop_material: string
      estimated_install_days: number
    }
  }
  financials: {
    gross_cost_usd: number
    federal_tax_credit_usd: number
    state_rebate_usd: number
    net_cost_usd: number
    annual_savings_usd: number
    payback_years: number
    lifetime_savings_usd: number
  }
  carbon: {
    annual_co2_offset_tons: number
    equivalent_cars_removed: number
    equivalent_flights_avoided: number
    equivalent_trees_planted: number
  }
  subsurface_summary: string
  homeowner_considerations: string[]
  confidence_notes: {
    section: string
    confidence: 'high' | 'medium' | 'low'
    note: string
  }[]
}
