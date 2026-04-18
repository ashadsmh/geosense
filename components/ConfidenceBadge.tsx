export default function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-red-100 text-red-800 border-red-200'
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)} Confidence
    </span>
  );
}
