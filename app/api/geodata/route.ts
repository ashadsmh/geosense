import { NextRequest, NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const zipCode = request.nextUrl.searchParams
    .get('zip') || '08540'
  
  const supabase = serverSupabase;
  
  console.log('[GeoData API] Fetching for zip:', zipCode)
  
  let { data: soil } = await supabase
    .from('soil_data')
    .select('*')
    .eq('zip_code', zipCode)
    .single()
  
  if (!soil) {
    const { data: fallback } = await supabase
      .from('soil_data')
      .select('*')
      .eq('zip_code', '08540')
      .single()
    soil = fallback
  }
  
  let { data: climate } = await supabase
    .from('climate_data')
    .select('*')
    .eq('zip_code', zipCode)
    .single()
  
  if (!climate) {
    const { data: fallback } = await supabase
      .from('climate_data')
      .select('*')
      .eq('zip_code', '08540')
      .single()
    climate = fallback
  }
  
  return NextResponse.json({ soil, climate })
}
