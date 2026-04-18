'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AddressInput from '@/components/AddressInput';

export default function HomePage() {
  const router = useRouter();
  const [lastReportId, setLastReportId] = useState<string | null>(null);
  const [lastAddress, setLastAddress] = useState<string | null>(null);

  useEffect(() => {
    try {
      const reportId = localStorage.getItem('geosense_last_report_id');
      const address = localStorage.getItem('geosense_last_address');
      if (reportId && address) {
        setLastReportId(reportId);
        setLastAddress(address);
      }
    } catch (e) {}
  }, []);

  const handleClearSession = () => {
    try {
      localStorage.removeItem('geosense_has_session');
    } catch (e) {}
    router.push('/');
  };

  return (
    <main suppressHydrationWarning className="relative bg-white text-gray-900 font-sans min-h-screen flex flex-col">
      {/* Moving Grid Background */}
      <div className="fixed inset-0 opacity-40 z-0 bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] animate-[gridMove_20s_linear_infinite]"></div>

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5"/>
              <path d="M9 4 L9 14 M4 9 L14 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="9" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-green-700 tracking-tight">GeoSense</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearSession}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5"
          >
            ← Landing page
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center pt-20 relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className="w-full flex flex-col md:flex-row items-center gap-12">
          
          {/* Left Column (45%) */}
          <div className="w-full lg:w-[45%] flex flex-col">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight leading-none mb-4">
              Discover your home's geothermal potential.
            </h1>

            <p className="text-base md:text-lg text-gray-500 mb-10 leading-relaxed max-w-md">
              Enter your address below.
            </p>

            <div className="w-full">
              <AddressInput 
                defaultAddress="Poe Field, Princeton University, Princeton, NJ 08544"
                defaultLotSize={50000}
                defaultEnergyCost={18000}
              />
            </div>

            {lastReportId && lastAddress && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  Last analysis:
                </span>
                <button
                  onClick={() => router.push('/report/' + lastReportId)}
                  className="text-sm text-green-700 hover:text-green-600 font-medium underline underline-offset-2 transition-colors text-left"
                >
                  {lastAddress}
                </button>
              </div>
            )}
          </div>

          {/* Right Column (55%) */}
          <div className="hidden lg:block w-full lg:w-[55%]">
            <div className="relative flex items-center justify-end w-full h-full min-h-[700px] pr-0 mr-[-60px]">
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                <Image
                  src="/images/geothermal-diagram.png"
                  alt="Geothermal heat pump system cross-section showing underground pipe loops, geological layers, and heat exchange process"
                  width={1400}
                  height={1175}
                  className="object-contain w-full h-auto max-h-[90vh]"
                  priority
                  placeholder="empty"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-gray-400 py-6 border-t border-gray-100 mt-auto">
        GeoSense · Powered by USGS · NOAA · EPA · Groq AI
      </footer>
    </main>
  );
}
