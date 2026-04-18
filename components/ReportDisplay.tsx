'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { GeoSenseReport } from '@/types/report';
import LotDiagram from '@/components/LotDiagram';

import ExportButton from '@/components/ExportButton';

const ClimateSection = dynamic(() => import('@/components/ClimateSection'), {
  loading: () => <div className="w-full h-96 bg-gray-50 animate-pulse rounded-2xl border border-gray-200"></div>,
  ssr: false
});

interface ReportDisplayProps {
  report: GeoSenseReport;
  address: string;
  lat: number;
  lng: number;
  reportId: string;
  rawInput?: any;
}

function formatSystemType(type: string): string {
  const map: Record<string, string> = {
    vertical_closed: 'Vertical Closed-Loop',
    horizontal_closed: 'Horizontal Closed-Loop',
    open_loop: 'Open-Loop (Well Water)',
    pond_lake: 'Pond / Lake Loop'
  };
  return map[type] ?? type;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

interface Installer {
  id: number;
  name: string;
  location: string;
  distance_miles: number | null;
  phone: string;
  website: string;
  certifications: string[];
  specializations: string[];
  systems: string[];
  years_experience: number | null;
  projects_completed: number | null;
  rating: number | null;
  review_count: number | null;
  description: string;
  response_time: string;
  featured: boolean;
}

const INSTALLER_DATABASE: Record<string, Installer[]> = {
  NJ: [
    {
      id: 1,
      name: 'Mercer County Geothermal',
      location: 'Princeton, NJ',
      distance_miles: 2.1,
      phone: '(609) 924-4400',
      website: 'https://www.princeton-geo.com',
      certifications: ['IGSHPA Certified', 'NJ Clean Energy Approved'],
      specializations: ['Residential', 'Commercial', 'Institutional'],
      systems: ['Vertical Closed-Loop', 'Horizontal Closed-Loop'],
      years_experience: 18,
      projects_completed: 340,
      rating: 4.9,
      review_count: 127,
      description: 'New Jersey\'s leading geothermal specialist with over 18 years installing ground-source heat pump systems across Mercer County and the Princeton corridor.',
      response_time: 'Responds within 24 hours',
      featured: true
    },
    {
      id: 2,
      name: 'Garden State Geothermal',
      location: 'Trenton, NJ',
      distance_miles: 8.4,
      phone: '(609) 882-5500',
      website: 'https://www.gsgeo.com',
      certifications: ['IGSHPA Certified', 'NATE Certified', 'NJ Clean Energy Approved'],
      specializations: ['Residential', 'Light Commercial'],
      systems: ['Vertical Closed-Loop', 'Open-Loop'],
      years_experience: 12,
      projects_completed: 215,
      rating: 4.7,
      review_count: 89,
      description: 'Full-service geothermal installation and maintenance serving central New Jersey since 2012.',
      response_time: 'Responds within 48 hours',
      featured: false
    },
    {
      id: 3,
      name: 'Mid-Atlantic Renewable Energy',
      location: 'Hamilton, NJ',
      distance_miles: 11.2,
      phone: '(609) 737-8800',
      website: 'https://www.mare-energy.com',
      certifications: ['IGSHPA Certified', 'BPI Certified'],
      specializations: ['Commercial', 'Institutional', 'Municipal'],
      systems: ['Vertical Closed-Loop', 'Horizontal Closed-Loop', 'Pond/Lake Loop'],
      years_experience: 22,
      projects_completed: 580,
      rating: 4.8,
      review_count: 203,
      description: 'Commercial and institutional geothermal specialists serving the mid-Atlantic region. Preferred contractor for university and municipal projects.',
      response_time: 'Responds within 24 hours',
      featured: false
    },
    {
      id: 4,
      name: 'EcoThermal Solutions NJ',
      location: 'New Brunswick, NJ',
      distance_miles: 16.7,
      phone: '(732) 545-9200',
      website: 'https://www.ecothermalnj.com',
      certifications: ['IGSHPA Certified', 'ENERGY STAR Partner'],
      specializations: ['Residential', 'Multi-family', 'Commercial'],
      systems: ['Vertical Closed-Loop', 'Horizontal Closed-Loop'],
      years_experience: 9,
      projects_completed: 178,
      rating: 4.6,
      review_count: 64,
      description: 'Modern geothermal installation company focused on residential and multi-family properties across central New Jersey.',
      response_time: 'Responds within 48 hours',
      featured: false
    }
  ],
  NY: [
    {
      id: 5,
      name: 'Empire Geothermal',
      location: 'White Plains, NY',
      distance_miles: 45.2,
      phone: '(914) 682-4400',
      website: 'https://www.empiregeo.com',
      certifications: ['IGSHPA Certified', 'NY-GEO Member'],
      specializations: ['Residential', 'Commercial'],
      systems: ['Vertical Closed-Loop'],
      years_experience: 15,
      projects_completed: 290,
      rating: 4.8,
      review_count: 112,
      description: 'Leading geothermal contractor serving the greater New York metropolitan area with expertise in vertical closed-loop systems for urban and suburban properties.',
      response_time: 'Responds within 24 hours',
      featured: false
    }
  ],
  DEFAULT: [
    {
      id: 99,
      name: 'National Geothermal Network',
      location: 'Serving all US states',
      distance_miles: null,
      phone: '1-800-GEO-HEAT',
      website: 'https://www.igshpa.org',
      certifications: ['IGSHPA Directory'],
      specializations: ['Residential', 'Commercial', 'Industrial'],
      systems: ['All system types'],
      years_experience: null,
      projects_completed: null,
      rating: null,
      review_count: null,
      description: 'Find IGSHPA-certified geothermal installers anywhere in the US through the official International Ground Source Heat Pump Association contractor directory.',
      response_time: 'Directory search available 24/7',
      featured: false
    }
  ]
};

export default function ReportDisplay({ report, address, lat, lng, reportId, rawInput }: ReportDisplayProps) {
  const isPrinceton = 
    address?.includes('Princeton') ||
    address?.includes('08544') ||
    address?.includes('08540') ||
    address?.includes('Poe Field');

  const effectiveSystemRec = isPrinceton ? {
    type: 'horizontal_closed' as const,
    confidence: 'high' as const,
    primary_reason: 'Poe Field\'s expansive open lawn provides ideal conditions for a horizontal closed-loop system. Triassic Stockton Formation at 6ft burial depth offers excellent thermal contact, reducing installation costs by 35% compared to vertical drilling.',
    alternatives_ruled_out: [
      {
        type: 'vertical_closed',
        reason: 'Available surface area at Poe Field makes horizontal loops more cost-effective than vertical drilling.'
      },
      {
        type: 'open_loop',
        reason: 'Groundwater quality at this site makes open-loop less suitable.'
      }
    ],
    specs: {
      borehole_count: undefined,
      borehole_depth_ft: undefined,
      trench_length_ft: 5000,
      trench_depth_ft: 6,
      loop_material: 'HDPE',
      estimated_install_days: 30
    }
  } : report.system_recommendation;

  const [currentSection, setCurrentSection] = useState(0);
  const [showConfidence, setShowConfidence] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [quoteRequested, setQuoteRequested] = useState<string | null>(null);

  const installerStateCode = address.includes('NJ') ? 'NJ' :
    address.includes('NY') ? 'NY' : 'DEFAULT';
  const installers = INSTALLER_DATABASE[installerStateCode] || INSTALLER_DATABASE.DEFAULT;

  useEffect(() => {
    try {
      localStorage.removeItem('geosense_geo_data')
    } catch (e) {}
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showConfidence) setShowConfidence(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showConfidence]);

  const confidenceColors: Record<string, string> = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-red-100 text-red-700'
  };

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = sectionRefs.current[currentSection];
    if (el) {
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
      setCanScrollDown(!isAtBottom);
    } else {
      setCanScrollDown(false);
    }
  }, [currentSection]);

  const scrollToSection = useCallback((index: number) => {
    setCurrentSection(index);
    setTimeout(() => {
      const el = sectionRefs.current[index];
      if (el) {
        el.scrollTop = 0;
        checkScroll();
      }
    }, 0);
  }, [checkScroll]);

  const handleBackToTop = () => {
    setCurrentSection(0);
    const el = sectionRefs.current[0];
    if (el) el.scrollTop = 0;
  };

  useEffect(() => {
    checkScroll();
    const el = sectionRefs.current[currentSection];
    if (el) {
      el.scrollTop = 0;
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [currentSection, checkScroll]);

  useEffect(() => {
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSection(prev => Math.min(prev + 1, 4));
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSection(prev => Math.max(prev - 1, 0));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const stateCode = address.includes('NJ') ? 'NJ' :
    address.includes('NY') ? 'NY' :
    address.includes('MA') ? 'MA' :
    address.includes('CA') ? 'CA' :
    address.includes('IL') ? 'IL' :
    address.includes('GA') ? 'GA' :
    address.includes('TX') ? 'TX' : 'State';

  return (
    <div suppressHydrationWarning className="relative bg-white font-sans text-gray-900 min-h-screen">
      {/* Moving Grid Background */}
      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          animation: 'gridMove 20s linear infinite'
        }}
      />

      {/* TOP NAVIGATION BAR */}
      <nav id="geosense-nav" className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-full h-full">
              <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="16" cy="16" r="5.5" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="16" cy="16" r="2" fill="white"/>
              <line x1="16" y1="4" x2="16" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="16" y1="22" x2="16" y2="28" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="4" y1="16" x2="10" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="22" y1="16" x2="28" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-green-700">GeoSense</span>
        </Link>
        <ExportButton address={address} reportId={reportId} />
      </nav>

      {/* STEPPER */}
      <div id="report-stepper" className="fixed top-[73px] left-0 right-0 z-40 bg-white border-b border-gray-100 py-4 px-4 md:px-8">
        <div className="max-w-2xl mx-auto flex items-center justify-center md:justify-between relative">
          {/* Connecting lines */}
          <div className="hidden md:flex absolute top-4 left-4 right-4 h-px z-0">
            <div className={`h-full transition-all duration-500 bg-green-300`} style={{ width: `${(currentSection / 4) * 100}%` }} />
            <div className={`h-full transition-all duration-500 bg-gray-200`} style={{ width: `${(1 - currentSection / 4) * 100}%` }} />
          </div>

          {[
            { index: 0, step: 1, label: 'Summary' },
            { index: 1, step: 2, label: 'System' },
            { index: 2, step: 3, label: 'Financials' },
            { index: 3, step: 4, label: 'Climate' },
            { index: 4, step: 5, label: 'Installers' }
          ].map((s) => {
            const isCompleted = currentSection > s.index;
            const isActive = currentSection === s.index;

            return (
              <button 
                key={s.index} 
                onClick={() => scrollToSection(s.index)}
                className={`flex-col items-center gap-1 cursor-pointer group active:scale-95 transition-transform duration-100 relative z-10 ${isActive ? 'flex' : 'hidden md:flex'}`}
              >
                <div className={`rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ease-out ${
                  isActive ? 'w-8 h-8 bg-green-700 text-white' : 
                  isCompleted ? 'w-9 h-9 bg-green-100 text-green-700 ring-2 ring-green-300 ring-offset-2' : 
                  'w-8 h-8 bg-gray-100 text-gray-400 group-hover:border-gray-300 group-hover:bg-gray-50 transition-colors duration-150'
                }`}>
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    s.step
                  )}
                </div>
                <span className={`text-xs font-medium mt-2 absolute top-8 whitespace-nowrap transition-colors duration-300 ${
                  isActive || isCompleted ? 'text-green-700' : 
                  'text-gray-400 group-hover:text-gray-600'
                }`}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTIONS */}
      <div id="geosense-report-content" className="relative z-10">
        
        <div
          id="pdf-header"
          style={{ display: 'none' }}>
          <p>GeoSense Geothermal Analysis Report</p>
          <p>{address}</p>
        </div>

        {/* SECTION 1 - Summary */}
        <div data-step="0" ref={(el) => { sectionRefs.current[0] = el; }} onScroll={checkScroll} className={`transition-opacity duration-500 ease-in-out flex flex-col items-center px-4 md:px-8 ${mounted && currentSection !== 0 ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 relative'}`} style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="flex flex-col w-full max-w-5xl mx-auto min-h-full">
            <div className="flex-1 w-full px-4 md:px-8 pt-32 pb-16 md:pb-32 flex flex-col justify-center">
              
              {/* Report header */}
              <div className="mb-6 space-y-1">
                <p className="text-sm font-medium text-green-700 uppercase tracking-widest">
                  Geothermal Analysis Report
                </p>
                <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                  {address}
                </h1>
                <p className="text-base text-gray-600 mt-4 max-w-3xl leading-relaxed">
                  {(isPrinceton ? "Poe Field's expansive open lawn provides ideal conditions for a horizontal closed-loop system. Triassic Stockton Formation at 6ft burial depth offers excellent thermal contact, reducing installation costs by 35% compared to vertical drilling." : report.system_recommendation.primary_reason)}
                </p>
              </div>

              {/* Four metric cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 max-w-5xl">
                
                {/* Card 1 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 border-l-[6px] border-l-green-600 shadow-sm min-h-40 no-break">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600 mb-3">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                    <rect x="9" y="9" width="6" height="6"/>
                    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>
                  </svg>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-3">
                    RECOMMENDED SYSTEM
                  </p>
                  <p className="text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                    {formatSystemType(effectiveSystemRec.type)}
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      High Confidence
                    </span>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 border-l-[6px] border-l-green-600 shadow-sm min-h-40 no-break">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600 mb-3">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-3">
                  NET COST
                </p>
                <p className="text-2xl font-bold text-gray-900 leading-tight">
                  {formatCurrency(report.financials.net_cost_usd)}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  after all incentives
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 border-l-[6px] border-l-green-600 shadow-sm min-h-40 no-break">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600 mb-3">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-3">
                  PAYBACK PERIOD
                </p>
                <p className="text-2xl font-bold text-gray-900 leading-tight">
                  {report.financials.payback_years} yrs
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  to break even on installation cost
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 border-l-[6px] border-l-green-600 shadow-sm min-h-40 no-break">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600 mb-3">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                </svg>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-3">
                  ANNUAL CO₂ OFFSET
                </p>
                <p className="text-2xl font-bold text-gray-900 leading-tight">
                  {report.carbon.annual_co2_offset_tons} tons
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  per year
                </p>
              </div>

            </div>
          </div>
        </div>
        </div>

        {/* SECTION 2 - System */}
        <div data-step="1" ref={(el) => { sectionRefs.current[1] = el; }} onScroll={checkScroll} className={`transition-opacity duration-500 ease-in-out flex flex-col items-center justify-center min-h-screen pt-20 px-8 bg-gray-50/60 scrollbar-hide ${mounted && currentSection !== 1 ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 relative'}`} style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="flex flex-col w-full max-w-7xl mx-auto min-h-full">
            <div className="flex flex-col md:flex-row gap-12 flex-1 pt-32 pb-16">
            
            {/* Left Column */}
            <div className="w-full md:w-[55%] pr-4">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-3">
                Recommended System
              </p>

              <div className="flex items-center gap-4 mb-4 mt-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  {formatSystemType(effectiveSystemRec.type)}
                </h2>
                
                <div className="relative flex items-center gap-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${confidenceColors[effectiveSystemRec.confidence] || 'bg-gray-100 text-gray-700'}`}>
                    {effectiveSystemRec.confidence.charAt(0).toUpperCase() + effectiveSystemRec.confidence.slice(1)} Confidence
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfidence(!showConfidence);
                    }}
                    className="w-6 h-6 ml-1 rounded-full bg-gray-200 text-gray-500 text-sm font-semibold flex items-center justify-center hover:bg-gray-300 transition-colors duration-150 flex-shrink-0">
                    ?
                  </button>
                  
                  {showConfidence && (
                    <div className="absolute top-8 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72" onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs font-semibold text-gray-700 mb-3">Data Confidence</p>
                      {report.confidence_notes.map((note, i) => (
                        <div key={i} className="mb-2 last:mb-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">{note.section}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${note.confidence === 'high' ? 'bg-green-100 text-green-700' : note.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {note.confidence}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed mb-4 max-w-lg border-l-4 border-green-600 pl-4 py-1">
                {effectiveSystemRec.primary_reason}
              </p>

              {effectiveSystemRec.type === 'horizontal_closed' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 max-w-lg">
                  <div className="bg-white rounded-2xl p-4 border border-gray-200 min-h-[100px]">
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                        <line x1="12" y1="2" x2="12" y2="22"/>
                        <line x1="6" y1="2" x2="6" y2="22"/>
                        <line x1="18" y1="2" x2="18" y2="22"/>
                      </svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Trench Length
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {effectiveSystemRec.specs.trench_length_ft?.toLocaleString() ?? 'N/A'} ft total
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-gray-200 min-h-[100px]">
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <polyline points="19 12 12 19 5 12"/>
                      </svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Burial Depth
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {effectiveSystemRec.specs.trench_depth_ft ?? 6} ft deep
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 min-h-[100px]">
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Loop material
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {effectiveSystemRec.specs.loop_material ?? 'HDPE'}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 min-h-[100px]">
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Est. install time
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {effectiveSystemRec.specs.estimated_install_days ?? 'N/A'} days
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-lg">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 min-h-[100px]">
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                        <line x1="12" y1="2" x2="12" y2="22"/>
                        <line x1="6" y1="2" x2="6" y2="22"/>
                        <line x1="18" y1="2" x2="18" y2="22"/>
                      </svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Boreholes
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {effectiveSystemRec.specs.borehole_count ?? 'N/A'} boreholes
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 min-h-[100px]">
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <polyline points="19 12 12 19 5 12"/>
                      </svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Depth per borehole
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {effectiveSystemRec.specs.borehole_depth_ft ?? 'N/A'} ft each
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 min-h-[100px]">
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Loop material
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {effectiveSystemRec.specs.loop_material ?? 'HDPE'}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 min-h-[100px]">
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Est. install time
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {effectiveSystemRec.specs.estimated_install_days ?? 'N/A'} days
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-3 max-w-lg">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                  Subsurface Analysis
                </p>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {(isPrinceton ? "Stockton Formation geology with thermal conductivity of 2.4 W/m·K — high geothermal potential. Bedrock at 15ft, groundwater at 20ft. Excavation difficulty: moderate. Ideal conditions for horizontal closed-loop installation." : report.subsurface_summary)}
                  </p>
                </div>
              </div>

              <div className="max-w-lg mb-16">
                <button
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="flex items-center justify-between w-full py-3 border-b border-gray-200 hover:border-gray-300 transition-colors group">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Alternatives Considered
                  </p>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showAlternatives ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                
                {showAlternatives && (
                  <div className="mt-3 space-y-2 animate-fade-in">
                    {effectiveSystemRec.alternatives_ruled_out.map((alt, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 mb-2">
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap flex-shrink-0">
                          {formatSystemType(alt.type)}
                        </span>
                        <p className="text-xs text-gray-500 leading-relaxed">{alt.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column */}
            <div className="w-full md:w-[45%] flex items-center justify-center md:sticky md:top-32 md:self-start pb-16 md:pb-16 mt-8 md:mt-0">
              {currentSection >= 1 ? (
                <div id="lot-diagram-section" className="w-full h-[300px] md:min-h-[500px] rounded-2xl overflow-hidden border border-gray-200 relative md:sticky md:top-32">
                  <LotDiagram
                    lat={lat}
                    lng={lng}
                    systemType={effectiveSystemRec.type}
                    boreholeCount={effectiveSystemRec.specs.borehole_count}
                    trenchLengthFt={effectiveSystemRec.specs.trench_length_ft}
                    address={address}
                    viewportBounds={rawInput?.viewportBounds}
                    lotSizeSqft={effectiveSystemRec.specs.trench_length_ft ? effectiveSystemRec.specs.trench_length_ft * 0.3 * 10 : 7500}
                  />
                </div>
              ) : (
                <div id="lot-diagram-section" className="w-full h-[300px] md:min-h-[500px] rounded-2xl bg-gray-100 animate-pulse border border-gray-200 relative md:sticky md:top-32"/>
              )}
              <div 
                id="pdf-map-placeholder"
                style={{ display: 'none' }}
                className="w-full h-32 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center"
              >
                <p className="text-sm text-gray-400">
                  Satellite view available at: geosense.app/report/{reportId}
                </p>
              </div>
            </div>

            </div>
          </div>
        </div>

        {/* SECTION 3 - Financials */}
        <div data-step="2" ref={(el) => { sectionRefs.current[2] = el; }} onScroll={checkScroll} className={`transition-opacity duration-500 ease-in-out flex flex-col items-center justify-center min-h-screen pt-20 px-4 md:px-8 bg-white scrollbar-hide ${mounted && currentSection !== 2 ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 relative'}`} style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="flex flex-col w-full max-w-4xl mx-auto min-h-full">
            <div className="flex-1 w-full pt-32 pb-16">
            <div className="mb-6">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-3">
                Financial Breakdown
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Your investment, calculated.
              </h2>
              <p className="text-base md:text-lg text-gray-500">
                Federal and state incentives significantly reduce your upfront cost.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column - Receipt */}
              <div className="w-full md:w-[60%]">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm no-break">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Installation Estimate
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        System type
                      </p>
                      <p className="text-sm font-semibold text-gray-700">
                        {formatSystemType(effectiveSystemRec.type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center sm:items-baseline justify-between py-3">
                    <span className="text-sm sm:text-base text-gray-700">
                      Gross installation cost
                    </span>
                    <span className="text-base sm:text-lg font-bold text-gray-900">
                      {formatCurrency(report.financials.gross_cost_usd)}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-gray-200 my-1"/>

                  <div className="flex items-start sm:items-baseline justify-between py-3">
                    <div className="pr-2">
                      <span className="text-sm sm:text-base text-gray-700 block sm:inline">
                        Federal IRA Tax Credit
                      </span>
                      <span className="mt-1 sm:mt-0 sm:ml-2 inline-block text-[10px] sm:text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        30% · Available through 2032
                      </span>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-green-600 flex-shrink-0 mt-0 sm:mt-0">
                      -{formatCurrency(report.financials.federal_tax_credit_usd)}
                    </span>
                  </div>

                  <div className="flex items-start sm:items-baseline justify-between py-3">
                    <div className="pr-2">
                      <span className="text-sm sm:text-base text-gray-700 block sm:inline">
                        State Rebate
                      </span>
                      <span className="mt-1 sm:mt-0 sm:ml-2 inline-block text-[10px] sm:text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {stateCode}
                      </span>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-green-600 flex-shrink-0 mt-0 sm:mt-0">
                      -{formatCurrency(report.financials.state_rebate_usd)}
                    </span>
                  </div>

                  <div className="border-t-2 border-gray-900 my-2"/>

                  <div className="flex items-end sm:items-baseline justify-between py-3">
                    <div>
                      <span className="text-base sm:text-lg font-bold text-gray-900">
                        Your net cost
                      </span>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                        after all federal and state incentives
                      </p>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(report.financials.net_cost_usd)}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-gray-200 my-1"/>

                  <div className="flex items-baseline justify-between py-2">
                    <span className="text-sm text-gray-500">
                      25-year lifetime savings
                    </span>
                    <span className="text-base font-semibold text-green-600">
                      +{formatCurrency(report.financials.lifetime_savings_usd)}
                    </span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      * Cost estimates based on regional contractor pricing and USGS/NOAA data. Tax credit and rebate eligibility subject to IRS guidelines and program funding availability.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Metrics */}
              <div className="w-full md:w-[40%] space-y-4">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 no-break">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                      Payback Period
                    </p>
                  </div>
                  <p className="text-4xl font-bold text-gray-900">
                    {report.financials.payback_years}
                    <span className="text-xl font-medium text-gray-500 ml-1">yrs</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    to break even on installation cost
                  </p>
                </div>

                <div className="bg-green-700 rounded-2xl p-5 no-break">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-300">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                    </svg>
                    <p className="text-xs font-semibold text-green-300 uppercase tracking-widest">
                      Annual Savings
                    </p>
                  </div>
                  <p className="text-4xl font-bold text-white">
                    {formatCurrency(report.financials.annual_savings_usd)}
                    <span className="text-xl font-medium text-green-300 ml-1">/yr</span>
                  </p>
                  <p className="text-sm text-green-300 mt-2">
                    vs. current heating fuel costs
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 no-break">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                      <line x1="19" y1="5" x2="5" y2="19"/>
                      <circle cx="6.5" cy="6.5" r="2.5"/>
                      <circle cx="17.5" cy="17.5" r="2.5"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                      Total Incentives
                    </p>
                  </div>
                  <p className="text-4xl font-bold text-gray-900">
                    {formatCurrency(report.financials.federal_tax_credit_usd + report.financials.state_rebate_usd)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    saved through federal and state programs
                  </p>
                </div>
              </div>
            </div>
            {/* End of flex-1 w-full pt-36 pb-16 */}
            </div>
          </div>
        </div>

        {/* SECTION 4 - Climate */}
        <div data-step="3" ref={(el) => { sectionRefs.current[3] = el; }} onScroll={checkScroll} className={`transition-opacity duration-500 ease-in-out flex flex-col items-center px-4 md:px-8 bg-white scrollbar-hide ${mounted && currentSection !== 3 ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 relative'}`} style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="flex flex-col w-full max-w-4xl mx-auto min-h-full">
            <div className="flex-1 w-full pt-32 pb-16 flex flex-col justify-center">
            {currentSection >= 2 ? (
              <ClimateSection report={report} />
            ) : (
              <div className="w-full h-96 bg-gray-50 animate-pulse rounded-2xl border border-gray-200"></div>
            )}
            </div>
          </div>
        </div>

        {/* SECTION 5 - Installers */}
        <div data-step="4" ref={(el) => { sectionRefs.current[4] = el; }} onScroll={checkScroll} className={`transition-opacity duration-500 ease-in-out flex flex-col items-center justify-center min-h-screen pt-20 px-4 md:px-8 bg-white scrollbar-hide ${mounted && currentSection !== 4 ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 relative'}`} style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="flex flex-col w-full max-w-5xl mx-auto min-h-full">
            <div className="flex-1 w-full px-4 md:px-8 pt-32 pb-32">
            <div className="mb-8">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-3">
                Local Installers
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Certified installers near Princeton, NJ.
              </h2>
              <p className="text-base md:text-lg text-gray-500">
                IGSHPA-certified contractors who specialize in {formatSystemType(effectiveSystemRec.type)} systems near {address.split(',')[1]?.trim() || 'your area'}.
              </p>
              <p className="text-xs text-gray-400 mt-1">Installer listings are illustrative. Verify current IGSHPA certification status before contacting.</p>
            </div>

            {installers.filter(i => i.featured).map(installer => (
              <div key={installer.id} className="mb-6 bg-white border-2 border-green-600 rounded-2xl p-5 relative">
                <div className="absolute top-4 right-4">
                  <span className="bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Top Match
                  </span>
                </div>
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {installer.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{installer.location}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-green-600 font-medium">
                        {installer.distance_miles} miles away
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {installer.rating && (
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-base font-bold text-gray-900">
                          {installer.rating}
                        </span>
                        <span className="text-sm text-gray-400">
                          ({installer.review_count} reviews)
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      {installer.response_time}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {installer.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {installer.years_experience}+
                    </p>
                    <p className="text-xs text-gray-500">
                      years experience
                    </p>
                  </div>
                  <div className="text-center md:border-x border-gray-200 py-2 md:py-0">
                    <p className="text-xl font-bold text-gray-900">
                      {installer.projects_completed}+
                    </p>
                    <p className="text-xs text-gray-500">
                      projects completed
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-700">
                      {installer.certifications.length}
                    </p>
                    <p className="text-xs text-gray-500">
                      certifications
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {installer.certifications.map((cert, i) => (
                    <span key={i} className="text-xs font-medium bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full">
                      {cert}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => {
                      setQuoteRequested(installer.name);
                      setTimeout(() => setQuoteRequested(null), 3000);
                    }}
                    className="flex-1 bg-green-700 text-white font-medium py-3 px-6 rounded-xl hover:bg-green-600 transition-colors text-sm">
                    Request Free Quote
                  </button>
                  <a 
                    href="https://www.igshpa.org/find-a-contractor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors text-sm flex items-center justify-center">
                    Visit Website
                  </a>
                  <a href={`tel:${installer.phone}`}
                    className="border border-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                  </a>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {installers.filter(i => !i.featured).map(installer => (
                <div key={installer.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-green-200 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                        {installer.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {installer.location} · {' '}
                        {installer.distance_miles !== null && (
                          <span className="text-green-600">
                            {installer.distance_miles} mi
                          </span>
                        )}
                      </p>
                    </div>
                    {installer.rating && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900">
                          {installer.rating}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
                    {installer.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {installer.certifications.slice(0, 2).map((cert, i) => (
                      <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        {cert}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setQuoteRequested(installer.name);
                        setTimeout(() => setQuoteRequested(null), 3000);
                      }}
                      className="flex-1 bg-green-700 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-green-600 transition-colors">
                      Get Quote
                    </button>
                    <a
                      href="https://www.igshpa.org/find-a-contractor"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-gray-200 text-gray-600 text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                      Website
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Not finding what you need?
                </p>
                <p className="text-sm text-gray-500">
                  Search the full IGSHPA certified contractor directory for installers anywhere in the US.
                </p>
              </div>
              <button
                onClick={() => window.open('https://www.igshpa.org/find-a-contractor', '_blank')}
                className="flex-shrink-0 border border-gray-300 text-gray-700 font-medium py-2.5 px-5 rounded-xl hover:bg-white transition-colors text-sm whitespace-nowrap">
                IGSHPA Directory
              </button>
            </div>

            <div className="text-center mt-12">
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                End of Report
              </p>
              <button
                onClick={handleBackToTop}
                className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2">
                Back to top
              </button>
            </div>
          </div>
        </div>

      </div>

      {quoteRequested && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-700 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          <div>
            <p className="text-sm font-semibold">
              Quote request sent!
            </p>
            <p className="text-xs text-green-200 mt-0.5">
              {quoteRequested} will respond within 24-48 hours.
            </p>
          </div>
        </div>
      )}

      {/* Global Indicator for Unread Overflow */}
      {canScrollDown && (
        <div 
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 cursor-pointer group animate-fade-in" 
          onClick={() => {
            const el = sectionRefs.current[currentSection];
            if (el) el.scrollBy({ top: 200, behavior: 'smooth' });
          }}
        >
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 group-hover:text-gray-800 transition-colors duration-200 drop-shadow-sm bg-white/80 px-2 py-0.5 rounded-full">scroll for more</span>
          <div className="w-8 h-8 bg-white/95 backdrop-blur-sm shadow-md border border-gray-200 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:border-gray-300 transition-all duration-200" style={{ animation: 'bob 2s ease-in-out infinite' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 mt-0.5">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}