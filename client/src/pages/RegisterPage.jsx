import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLock, FiMail, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';

export default function RegisterPage() {
  const { register } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' }); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(''); try { await register(form); toast.success('Your account is ready!'); navigate(location.state?.from?.pathname || '/', { replace: true }); } catch (err) { const message = getErrorMessage(err, 'We could not create your account. Please try again.'); setError(message); toast.error(message); } finally { setBusy(false); } };
  const fields = [{ key: 'name', label: 'Full name', type: 'text', icon: FiUser, auto: 'name', placeholder: 'Your name' }, { key: 'email', label: 'Email address', type: 'email', icon: FiMail, auto: 'email', placeholder: 'you@example.com' }, { key: 'password', label: 'Password', type: 'password', icon: FiLock, auto: 'new-password', placeholder: 'At least 8 characters' }];
  return <section className="page-enter mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center px-4 py-10"><div className="w-full max-w-[470px] rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-9"><div className="mb-7"><p className="text-sm font-bold text-amber-700">Join Make MI</p><h1 className="mt-2 text-3xl font-black text-slate-900">Create your account</h1><p className="mt-2 text-sm text-slate-500">A few details and you’re ready to go.</p></div>
    <form className="space-y-5" onSubmit={submit}>{fields.map(({ key, label, type, icon: Icon, auto, placeholder }) => <label className="block" key={key}><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span><span className="relative block"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input required minLength={key === 'password' ? 8 : undefined} autoComplete={auto} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100" placeholder={placeholder}/></span></label>)}
    {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<button disabled={busy} className="w-full rounded-lg bg-amber px-4 py-3 font-bold text-navy transition hover:bg-amber-300 disabled:opacity-60">{busy ? 'Creating account…' : 'Create account'}</button></form>
    <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">Already have an account? <Link className="font-bold text-sky-700 hover:underline" to="/login">Sign in</Link></p></div></section>;
}
