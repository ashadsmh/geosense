import { GeoSenseReport } from '@/types/report';

export default function ClimateSection({ report }: { report: GeoSenseReport }) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-3">
          Climate Impact
        </p>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Your contribution to a cleaner grid.
        </h2>
        <p className="text-base text-gray-500 max-w-2xl mx-auto">
          Every geothermal system installed reduces dependence on fossil fuels. Here is what yours means.
        </p>
      </div>

      <div className="text-center mb-8">
        <p className="text-5xl font-bold text-gray-900 mb-2">
          {report.carbon.annual_co2_offset_tons}
          <span className="text-xl font-medium text-green-700 ml-3">tons CO₂/yr</span>
        </p>
        <p className="text-gray-500 text-base">
          offset annually — {' '}
          <span className="text-green-700 font-semibold">
            {Math.round(report.carbon.annual_co2_offset_tons * 25)} tons
          </span>
          {' '}over the system lifetime
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        <div className="bg-white border border-gray-200 border-l-4 border-l-green-600 rounded-2xl p-6 text-center no-break">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-400">
              <path d="M12 2c0 6-8 8-8 14a8 8 0 0016 0c0-2-1-4-2-5-1 3-3 4-3 4 0-4-3-7-3-13z"/>
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {Math.round(report.carbon.annual_co2_offset_tons * 3.28) >= 12 ? 'Full year' : `${Math.round(report.carbon.annual_co2_offset_tons * 3.28)} months`}
          </p>
          <p className="text-sm font-semibold text-gray-900 mb-2">
            of heating offset
          </p>
          <p className="text-sm text-gray-500">
            {Math.round(report.carbon.annual_co2_offset_tons * 3.28) >= 12 ? `${Math.round(report.carbon.annual_co2_offset_tons * 3.28)} months — entire annual heating demand offset` : 'of home heating demand offset annually'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 border-l-4 border-l-green-600 rounded-2xl p-6 text-center no-break">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-400">
              <path d="M12 22V12M8 12H3l9-10 9 10h-5"/>
              <path d="M8 17H4l8-8 8 8h-4"/>
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {Math.round(report.carbon.equivalent_trees_planted * 25).toLocaleString()}
          </p>
          <p className="text-sm font-semibold text-gray-900 mb-2">
            trees worth of carbon
          </p>
          <p className="text-sm text-gray-500">
            absorbed over the 25-year system lifetime
          </p>
        </div>

        <div className="bg-white border border-gray-200 border-l-4 border-l-green-600 rounded-2xl p-6 text-center no-break">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-400">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {Math.round((report.carbon.annual_co2_offset_tons * 25) / 0.26)}
          </p>
          <p className="text-sm font-semibold text-gray-900 mb-2">
            round trips avoided lifetime
          </p>
          <p className="text-sm text-gray-500">
            NYC to Miami equivalent, over 25 years
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400 leading-relaxed max-w-2xl mx-auto text-center">
          * Carbon figures based on EPA eGRID regional emission factors. Tree and flight equivalences use EPA and ICAO methodology respectively. Lifetime figures assume 25-year system lifespan.
        </p>
      </div>
    </div>
  );
}
