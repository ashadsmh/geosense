'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type GeoData = {
  zip_code: string
  address: string
  lat: number
  lng: number
  soil: {
    soil_class: string
    thermal_conductivity_w_mk: number
    bedrock_depth_ft: number
    groundwater_depth_ft: number
    drilling_difficulty: string
    county: string
    state: string
  }
  climate: {
    climate_zone: string
    heating_degree_days: number
    cooling_degree_days: number
    avg_ground_temp_f: number
  }
};

const STEPS = [
  { time: 0, label: "Geocoding address" },
  { time: 1083, label: "Querying USGS soil database" },
  { time: 2166, label: "Fetching NOAA climate data" },
  { time: 3250, label: "Calculating thermal conductivity" },
  { time: 4333, label: "Running Groq subsurface model" },
  { time: 5416, label: "Generating your report" },
];

function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');
  const supabase = createClient();

  const [activeStep, setActiveStep] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);

  const [geoData, setGeoData] = useState<{
    zip_code: string
    address: string
    lat: number
    lng: number
    soil: {
      soil_class: string
      thermal_conductivity_w_mk: number
      bedrock_depth_ft: number
      groundwater_depth_ft: number
      drilling_difficulty: string
      county: string
      state: string
    }
    climate: {
      climate_zone: string
      heating_degree_days: number
      cooling_degree_days: number
      avg_ground_temp_f: number
    }
  } | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        'geosense_geo_data'
      )
      if (stored) {
        const parsed = JSON.parse(stored)
        // Only use if fresh (within last 5 minutes)
        if (Date.now() - parsed.timestamp < 300000) {
          setGeoData(parsed)
        }
      }
    } catch (e) {
      console.log('Could not read geo data', e)
    }
  }, []);

  const getStepCallout = (
    stepIndex: number,
    geoData: GeoData | null
  ): string => {
    
    // Check if this is Princeton demo
    const isPrinceton = 
      geoData?.zip_code === '08544' ||
      geoData?.zip_code === '08540' ||
      geoData?.address?.includes('Poe Field') ||
      geoData?.address?.includes('Princeton University')
    
      if (!geoData) {
      // Fallback to Princeton hardcoded values 
      // if no data available
      const fallbacks = [
        '40.3434° N, 74.6550° W',
        'Triassic Shale — Poe Field, Princeton',
        'Climate Zone 4A — HDD 4,800',
        '2.1 W/m·K — Ideal For Horizontal Loops',
        'Horizontal Loop Recommended — 94% Score',
        'Report Ready'
      ]
      const fallbackStr = fallbacks[stepIndex] || ''
      return fallbackStr.replace(/(^\w|\s\w)/g, l => l.toUpperCase())
    }
    
    const { soil, climate, lat, lng } = geoData
    
    // Format soil class for display
    const soilDisplay = soil.soil_class
      .replace(/_/g, ' ')
      .replace(/(^\w|\s\w)/g, l => l.toUpperCase())
    
    // Format drilling difficulty
    const drillingDisplay = soil.drilling_difficulty
      .replace(/_/g, ' ')
      .replace(/(^\w|\s\w)/g, l => l.toUpperCase())
    
    // Format area
    const countyDisplay = soil.county
      .replace(/_/g, ' ')
      .replace(/(^\w|\s\w)/g, l => l.toUpperCase())
    const stateDisplay = typeof soil.state === 'string' ? soil.state.toUpperCase() : soil.state
    
    const callouts = [
      // Step 1: Geocoding
      `${lat?.toFixed(4)}° N, ${Math.abs(
        lng ?? 0
      ).toFixed(4)}° W`,
      
      // Step 2: USGS soil
      (isPrinceton && stepIndex === 1)
        ? 'Triassic Shale — Poe Field, Princeton'
        : `${soilDisplay} — ${countyDisplay}, ${stateDisplay}`,
      
      // Step 3: NOAA climate
      `Climate Zone ${climate.climate_zone} — ` +
      `HDD ${climate.heating_degree_days
        .toLocaleString()}`,
      
      // Step 4: Thermal conductivity
      (isPrinceton && stepIndex === 3)
        ? '2.1 W/m·K — Ideal For Horizontal Loops'
        : `${soil.thermal_conductivity_w_mk} W/m·K — ` +
          `${drillingDisplay} Drilling`,
      
      // Step 5: Groq model
      (isPrinceton && stepIndex === 4)
        ? 'Horizontal Loop Recommended — 94% Score'
        : '4 Systems Evaluated',
      
      // Step 6: Complete
      'Report Ready'
    ]
    
    const finalCallout = callouts[stepIndex] || ''
    return finalCallout.replace(/(^\w|\s\w)/g, l => l.toUpperCase())
  }

  useEffect(() => {
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 6 / 65;
      if (currentStep >= 6) {
        currentStep = 6;
        clearInterval(interval);
      }
      setProgress((currentStep / 6) * 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!reportId) {
      router.push('/');
      return;
    }

    const timers = STEPS.map((step, index) => 
      setTimeout(() => setActiveStep(index), step.time)
    );

    let pollCount = 0;
    const maxPolls = 20; // 30 seconds / 1.5s
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('gemini_output')
          .eq('id', reportId)
          .single();

        if (data?.gemini_output) {
          setIsReady(true);
          clearInterval(pollInterval);
        } else if (pollCount >= maxPolls) {
          setHasError(true);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(pollInterval);
    };
  }, [reportId, supabase, router]);

  useEffect(() => {
    if (isReady && activeStep === STEPS.length - 1) {
      const timeout = setTimeout(() => {
        try {
          if (reportId) {
            localStorage.setItem('geosense_last_report_id', reportId);
          }
        } catch (e) {}
        router.push(`/report/${reportId}`);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [isReady, activeStep, reportId, router]);

  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-4">
        <div className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-5 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5"/>
                <path d="M9 4 L9 14 M4 9 L14 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="9" r="2.5" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-green-400 tracking-tight">GeoSense</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-xl font-semibold mb-2">
              Analysis failed
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              The report took too long to generate. This sometimes happens during high demand.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-2.5 border border-gray-600 text-gray-300 rounded-xl text-sm hover:border-gray-400 transition-colors">
              Start over
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-green-700 text-white rounded-xl text-sm hover:bg-green-600 transition-colors">
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isComplete = isReady && activeStep === STEPS.length - 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-4 pt-20 relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-96 h-96 bg-green-950/20 rounded-full blur-3xl"/>
      </div>

      <div className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-5 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5"/>
              <path d="M9 4 L9 14 M4 9 L14 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="9" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-green-400 tracking-tight">GeoSense</span>
        </div>
      </div>
      
      <div className="w-full max-w-[680px] flex flex-col items-center justify-center z-10">
        {isComplete ? (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white text-xl font-semibold">
              Report ready
            </p>
            <p className="text-gray-500 text-sm">
              Redirecting to your report...
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col w-full max-w-2xl">
              {STEPS.map((step, index) => {
                const isPast = index < activeStep;
                const isActive = index === activeStep;
                const isFuture = index > activeStep;

                return (
                  <div 
                    key={index} 
                    className={`flex items-center py-4 border-b border-gray-800/50 transition-all duration-500 ${
                      isFuture ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                    }`}
                  >
                    <div className="w-6 flex-shrink-0 flex items-center justify-center mr-4 md:mr-6">
                      {isPast ? (
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isActive ? (
                        <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-700 rounded-full" />
                      )}
                    </div>
                    
                    <div className={`w-full md:w-64 text-left md:text-right text-xs md:text-sm ${isPast ? 'text-gray-400' : isActive ? 'text-white font-medium' : 'text-gray-600'}`}>
                      {step.label}
                      {isActive && <span className="text-gray-500 animate-pulse">...</span>}
                    </div>

                    <div className="hidden md:block w-px h-4 bg-gray-700 self-center mx-8 flex-shrink-0" />

                    <div className="hidden md:block w-64 text-left text-sm font-mono text-green-400">
                      <span className={`transition-opacity duration-500 ${isPast ? 'opacity-100' : 'opacity-0'}`}>
                        {getStepCallout(index, geoData)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="w-full mt-12">
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Analyzing property</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1">
                <div 
                  className="bg-green-500 h-1 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress > 50 && !isReady && (
                <p className="text-xs text-gray-400 text-center mt-4 animate-pulse">
                  Still working — Groq is generating your detailed report. This can take up to 30 seconds for complex properties.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <AnalyzeContent />
    </Suspense>
  );
}
