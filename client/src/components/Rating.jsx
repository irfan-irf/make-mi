import { FiStar } from 'react-icons/fi';
export default function Rating({ value = 0, count, compact = false }) {
  const rating = Number(value) || 0;
  return <span className="inline-flex items-center gap-1.5 text-sm" aria-label={`${rating.toFixed(1)} out of 5 stars`}><span className="inline-flex items-center gap-0.5 text-amber-500">{[1,2,3,4,5].map((n) => <FiStar key={n} size={compact ? 13 : 15} className={rating >= n - 0.5 ? 'fill-current' : ''}/>)}</span><span className="font-semibold text-slate-700">{rating.toFixed(1)}</span>{count !== undefined && <span className="text-slate-400">({count})</span>}</span>;
}
