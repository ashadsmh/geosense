import { Metadata } from 'next';
import Link from 'next/link';
import { serverSupabase } from '@/lib/supabase/server';
import { GeoSenseReport } from '@/types/report';
import ReportDisplay from '@/components/ReportDisplay';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const supabase = serverSupabase;
    const { data } = await supabase.from('reports').select('address').eq('id', id).single();
    return {
      title: data ? `GeoSense Report — ${data.address}` : 'Report Not Found',
    };
  } catch (error) {
    console.error('[GeoSense] Metadata fetch failed:', error);
    return { title: 'GeoSense Report' };
  }
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  console.log('[GeoSense] Fetching report:', id);

  const supabase = serverSupabase;

  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

  console.log('[GeoSense] Report response:', { data: report, error });

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Report not found</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            We couldn't find a report with that ID. It may have expired or the link might be incorrect.
          </p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-medium transition-colors w-full sm:w-auto">
            Analyze a new property
          </Link>
        </div>
      </div>
    );
  }

  const gemini = report.gemini_output as GeoSenseReport;

  return (
    <ReportDisplay 
      report={gemini} 
      address={report.address} 
      lat={report.lat} 
      lng={report.lng} 
      reportId={report.id} 
      rawInput={report.raw_input}
    />
  );
}
