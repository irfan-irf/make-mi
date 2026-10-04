import { FiAlertCircle, FiLoader } from 'react-icons/fi';

export function PageSpinner({ label = 'Loading…' }) {
  return <div className="flex min-h-[45vh] items-center justify-center gap-3 text-sm font-medium text-slate-600" role="status"><FiLoader className="animate-spin text-xl text-amber-600" />{label}</div>;
}

export function EmptyState({ title, message, action }) {
  return <div className="mx-auto my-12 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-700"><FiAlertCircle size={22} /></div><h2 className="text-lg font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>{action}</div>;
}
