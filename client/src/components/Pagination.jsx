import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages < 2) return null;
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => Math.min(Math.max(1, page - 2) + i, pages)).filter((n, i, all) => all.indexOf(n) === i);
  return <nav aria-label="Product pages" className="mt-9 flex items-center justify-center gap-2"><button className="grid h-10 w-10 place-items-center rounded-lg border bg-white text-slate-700 disabled:opacity-40" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page"><FiChevronLeft/></button>{nums.map((n) => <button key={n} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined} className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${n === page ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}>{n}</button>)}<button className="grid h-10 w-10 place-items-center rounded-lg border bg-white text-slate-700 disabled:opacity-40" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page"><FiChevronRight/></button></nav>;
}
