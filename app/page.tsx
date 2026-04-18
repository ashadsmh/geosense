'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AddressInput from '@/components/AddressInput';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const hasSession = localStorage.getItem('geosense_has_session');
      if (hasSession === 'true') {
        router.push('/home');
      }
    } catch (e) {}

    if (window.innerWidth < 768) {
      document.documentElement.style.scrollSnapType = 'y proximity';
    } else {
      document.documentElement.style.scrollSnapType = 'y mandatory';
    }
    return () => {
      document.documentElement.style.scrollSnapType = '';
    };
  }, [router]);

  return (
    <main className="relative bg-white text-gray-900 font-sans">
      {/* Moving Grid Background */}
      <div className="grid-bg"></div>

      <style jsx global>{`
        .grid-bg {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(#e5e7eb 1px, transparent 1px),
            linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridMove 20s linear infinite;
          opacity: 0.4;
          z-index: 0;
        }

        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }

        .section { 
          scroll-snap-align: start;
          height: 100vh;
          overflow: hidden;
          position: relative;
          z-index: 1;
          background: transparent;
        }

        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        .animate-bob {
          animation: bob 2s ease-in-out infinite;
        }
      `}</style>

      {/* SECTION 1 — Hero */}
      <section className="section flex items-center justify-center px-4 md:px-12 lg:px-24">
        <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="flex flex-col items-start pt-12">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5"/>
                  <path d="M9 4 L9 14 M4 9 L14 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="9" cy="9" r="2.5" fill="white"/>
                </svg>
              </div>
              <span className="text-2xl font-bold text-green-700 tracking-tight">GeoSense</span>
            </div>
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-none mb-6">
              Discover your home's geothermal potential.
            </h1>
            <p className="text-base md:text-lg text-gray-500 max-w-lg mb-10 leading-relaxed">
              GeoSense analyzes USGS geology and NOAA climate data to generate a personalized geothermal energy report for any US property — in seconds.
            </p>
          </div>

          {/* Right Column - Isometric SVG */}
          <div className="hidden md:flex relative w-full h-full items-center justify-center">
            <div className="relative flex items-center justify-center w-full h-full min-h-[600px]">
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                <Image
                  src="/images/geothermal-diagram.png"
                  alt="Geothermal heat pump system cross-section showing underground pipe loops, geological layers, and heat exchange process"
                  width={720}
                  height={620}
                  className="object-contain w-full h-auto max-h-[680px]"
                  priority
                  placeholder="empty"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
          <button 
            onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
            className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center animate-bob cursor-pointer hover:bg-gray-700 transition-colors"
            aria-label="Scroll to explore"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <span className="text-xs text-gray-400">scroll to explore</span>
        </div>
      </section>

      {/* SECTION 2 — Why Geothermal */}
      <section className="section flex flex-col justify-center items-center px-4 md:px-12 py-8 md:py-12">
        <div className="w-full max-w-5xl mx-auto">
          <h2 className="text-sm font-semibold text-green-700 tracking-widest uppercase text-center mb-2">WHY GEOTHERMAL?</h2>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">The clean energy hiding beneath your feet.</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1 */}
            <div className="bg-white border border-gray-200 border-l-4 border-l-green-800 rounded-xl p-4 shadow-sm">
              <div className="text-3xl font-bold text-green-700">400%*</div>
              <div className="text-sm font-semibold text-gray-900 mt-1">System Efficiency</div>
              <div className="text-xs text-gray-500 mt-2 leading-relaxed">GSHPs deliver 4 units of heat for every 1 unit of electricity consumed — outperforming solar and wind on efficiency.</div>
            </div>
            {/* Stat 2 */}
            <div className="bg-white border border-gray-200 border-l-4 border-l-green-800 rounded-xl p-4 shadow-sm">
              <div className="text-3xl font-bold text-green-700">30%</div>
              <div className="text-sm font-semibold text-gray-900 mt-1">Federal Tax Credit</div>
              <div className="text-xs text-gray-500 mt-2 leading-relaxed">The Inflation Reduction Act guarantees a 30% tax credit on geothermal installation costs, available through 2032.</div>
            </div>
            {/* Stat 3 */}
            <div className="bg-white border border-gray-200 border-l-4 border-l-green-800 rounded-xl p-4 shadow-sm">
              <div className="text-3xl font-bold text-green-700">50%</div>
              <div className="text-sm font-semibold text-gray-900 mt-1">Energy Cost Reduction</div>
              <div className="text-xs text-gray-500 mt-2 leading-relaxed">Typical homeowners reduce heating and cooling costs by half compared to conventional gas or oil systems.</div>
            </div>
            {/* Stat 4 */}
            <div className="bg-white border border-gray-200 border-l-4 border-l-green-800 rounded-xl p-4 shadow-sm">
              <div className="text-3xl font-bold text-green-700">25 yr</div>
              <div className="text-sm font-semibold text-gray-900 mt-1">System Lifespan</div>
              <div className="text-xs text-gray-500 mt-2 leading-relaxed">Ground loops last 25+ years with minimal maintenance, far outlasting conventional HVAC equipment.</div>
            </div>
          </div>
          <div className="mt-6 text-xs text-gray-400 text-center">
            * Up to 400% efficiency under optimal operating conditions. Actual performance varies by climate zone and installation.
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
          <button 
            onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
            className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center animate-bob cursor-pointer hover:bg-gray-700 transition-colors"
            aria-label="Scroll to explore"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </section>

      {/* SECTION 3 — How it works */}
      <section className="section flex flex-col items-center justify-center px-4 md:px-12 py-8 md:py-12">
        <div className="max-w-2xl w-full mx-auto flex flex-col h-full justify-center">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold text-green-700 tracking-widest uppercase mb-4">HOW IT WORKS</h2>
            <h3 className="text-2xl md:text-4xl font-bold text-gray-900">From address to insight</h3>
          </div>

          <div className="flex flex-col space-y-0">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
              <div className="flex flex-col items-center md:mr-6 mb-4 md:mb-0">
                <div className="w-10 h-10 bg-green-700 text-white font-bold rounded-full flex items-center justify-center flex-shrink-0">1</div>
                <div className="hidden md:block w-0.5 h-12 bg-green-200 my-2"></div>
              </div>
              <div className="pt-1 pb-6 md:pb-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">Enter your street address</h4>
                <p className="text-base text-gray-500 leading-relaxed">
                  We instantly query USGS soil databases, NOAA climate stations, and EPA carbon factors for your exact coordinates.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
              <div className="flex flex-col items-center md:mr-6 mb-4 md:mb-0">
                <div className="w-10 h-10 bg-green-700 text-white font-bold rounded-full flex items-center justify-center flex-shrink-0">2</div>
                <div className="hidden md:block w-0.5 h-12 bg-green-200 my-2"></div>
              </div>
              <div className="pt-1 pb-6 md:pb-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">AI models your subsurface</h4>
                <p className="text-base text-gray-500 leading-relaxed">
                  Our system queries your property's exact USGS soil profile and runs a weighted geological scoring model to select the optimal system — Gemini synthesizes the findings into your personalized report.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
              <div className="flex flex-col items-center md:mr-6 mb-4 md:mb-0">
                <div className="w-10 h-10 bg-green-700 text-white font-bold rounded-full flex items-center justify-center flex-shrink-0">3</div>
              </div>
              <div className="pt-1 pb-6 md:pb-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">Get your personalized report</h4>
                <p className="text-base text-gray-500 leading-relaxed">
                  Receive your system specs, borehole depth, a full financial breakdown with IRA credits, and your reduced carbon impact — all in under 15 seconds.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button 
              onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
              className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center animate-bob cursor-pointer hover:bg-gray-700 transition-colors"
              aria-label="Scroll to explore"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Address Input CTA */}
      <section className="section flex flex-col items-center justify-center px-4 md:px-12 py-8 md:py-12">
        <div className="w-full md:max-w-xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3">Ready to see what's beneath your property?</h3>
          <p className="text-base md:text-lg text-gray-500 text-center mb-10">Enter your address below.</p>
          
          <AddressInput 
            defaultAddress=""
            defaultHomeSizeSqft={20000}
            defaultHeatingFuel="gas"
            defaultEnergyCost={18000}
          />
        </div>
      </section>
    </main>
  );
}
