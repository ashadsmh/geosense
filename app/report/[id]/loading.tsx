export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-3">
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="h-8 w-64 md:w-96 bg-slate-200 rounded"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
        </div>

        {/* Top Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 h-32">
              <div className="h-4 w-1/2 bg-slate-200 rounded mb-4"></div>
              <div className="h-8 w-3/4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 h-96"></div>
            <div className="bg-white rounded-2xl border border-slate-200 h-64"></div>
          </div>
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 h-80"></div>
            <div className="bg-white rounded-2xl border border-slate-200 h-48"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
