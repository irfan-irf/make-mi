import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiShoppingCart, FiHeart, FiUser, FiX, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import useDebounce from '../hooks/useDebounce.js';
import api, { responseData } from '../services/api.js';

const categories = ['Fashion', 'Electronics', 'Home', 'Books'];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const debouncedQuery = useDebounce(query.trim(), 250);
  const navigate = useNavigate();
  useEffect(() => {
    if (debouncedQuery.length < 2) { setSuggestions([]); return undefined; }
    const controller = new AbortController();
    api.get('/products/suggestions', { params: { q: debouncedQuery }, signal: controller.signal }).then((res) => setSuggestions(responseData(res) || [])).catch((error) => { if (error.code !== 'ERR_CANCELED') setSuggestions([]); });
    return () => controller.abort();
  }, [debouncedQuery]);
  const search = (event) => { event.preventDefault(); const params = new URLSearchParams(); if (query.trim()) params.set('search', query.trim()); if (category) params.set('category', category); navigate(`/products${params.size ? `?${params}` : ''}`); setOpen(false); setSuggestionsOpen(false); };
  const chooseSuggestion = (item) => { navigate(`/product/${item._id}`); setSuggestionsOpen(false); setOpen(false); };
  const searchForm = (mobile = false) => <div className={`relative ${mobile ? 'mb-4' : 'mx-auto hidden h-10 max-w-2xl flex-1 md:block'}`}><form onSubmit={search} className={`flex overflow-hidden rounded-md bg-white ${mobile ? 'h-11' : 'h-full'}`}>
    {!mobile && <label className="sr-only" htmlFor="site-search">Search products</label>}{!mobile && <select value={category} onChange={(e)=>setCategory(e.target.value)} aria-label="Search category" className="max-w-[130px] border-r border-slate-200 bg-slate-100 px-2 text-xs text-slate-700"><option value="">All departments</option>{categories.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}</select>}
    <input id={mobile?undefined:'site-search'} className="min-w-0 flex-1 px-3 text-sm text-slate-900 outline-none" placeholder="Search Make MI" value={query} onFocus={()=>setSuggestionsOpen(true)} onChange={(e) => setQuery(e.target.value)} aria-label="Search Make MI" />
    <button className="grid w-12 shrink-0 place-items-center bg-amber text-navy hover:bg-amber-300" aria-label="Search"><FiSearch size={20} /></button>
  </form>{suggestionsOpen&&suggestions.length>0&&<div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-slate-900 shadow-xl">{suggestions.map((item)=><button key={item._id} onMouseDown={(e)=>e.preventDefault()} onClick={()=>chooseSuggestion(item)} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-slate-50"><span>{item.name}</span><span className="ml-3 text-xs capitalize text-slate-400">{item.category}</span></button>)}</div>}</div>;

  return <header className="sticky top-0 z-40 text-white shadow-lg">
    <div className="bg-navy"><div className="mx-auto flex min-h-[68px] max-w-7xl items-center gap-3 px-4 py-3 lg:px-6">
      <button className="rounded-md p-2 hover:bg-white/10 md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <FiX size={22} /> : <FiMenu size={22} />}</button>
      <Link to="/" className="shrink-0 rounded px-1 py-1 text-xl font-black tracking-tight sm:text-2xl">Make MI<span className="text-amber">.</span></Link>
      {searchForm()}
      <div className="ml-auto flex items-center gap-1 sm:gap-3 md:ml-0">
        <Link to={user ? '/profile' : '/login'} className="hidden items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/10 sm:flex"><FiUser size={19} /><span className="max-w-24 truncate text-xs"><span className="block text-slate-300">Hello, {user?.name?.split(' ')[0] || 'sign in'}</span><strong className="text-sm">Account</strong></span></Link>
        <Link to="/wishlist" className="relative rounded-md p-2 hover:bg-white/10" aria-label={`Wishlist, ${wishlistCount} items`}><FiHeart size={21} />{wishlistCount>0&&<span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{wishlistCount}</span>}</Link>
        <Link to="/cart" className="relative rounded-md p-2 hover:bg-white/10" aria-label={`Cart, ${itemCount} items`}><FiShoppingCart size={22} /><span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-amber px-1 text-[10px] font-bold text-navy">{itemCount}</span></Link>
      </div>
    </div>
    <div className="hidden items-center gap-6 bg-navy-light px-6 py-2 text-sm font-medium md:flex">
      <Link className="flex items-center gap-2 whitespace-nowrap hover:text-amber" to="/products">
        <FiMenu size={15} aria-hidden="true" />
        <span>All</span>
      </Link>
      {categories.map((c) => (
        <Link className="whitespace-nowrap hover:text-amber" key={c} to={`/products?category=${c.toLowerCase()}`}>
          {c}
        </Link>
      ))}
      <Link className="ml-auto flex items-center gap-1 whitespace-nowrap text-amber hover:text-white" to="/color-match">
        Find My Colors <FiArrowRight />
      </Link>
      {user && (
        <button className="whitespace-nowrap text-slate-300 hover:text-white" onClick={() => logout({ notify: true })}>
          Sign out
        </button>
      )}
    </div>
    </div>
    {open && <nav className="absolute left-0 right-0 top-full border-t border-white/10 bg-navy-light p-4 shadow-xl md:hidden">{searchForm(true)}<div className="grid grid-cols-2 gap-2">{categories.map((c) => <Link onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 hover:bg-white/10" key={c} to={`/products?category=${c.toLowerCase()}`}>{c}</Link>)}<Link onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-amber" to="/color-match">Find My Colors</Link><Link onClick={() => setOpen(false)} className="rounded-lg px-3 py-3" to={user ? '/profile' : '/login'}>{user?.name || 'Sign in'}</Link>{user && <button onClick={() => logout({ notify: true })} className="rounded-lg px-3 py-3 text-left">Sign out</button>}</div></nav>}
  </header>;
}
