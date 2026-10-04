import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiSearch, FiX } from 'react-icons/fi';
import api, { getErrorMessage, responseData } from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import ProductFilters from '../components/ProductFilters.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState } from '../components/Feedback.jsx';
import { ProductGridSkeleton } from '../components/Skeletons.jsx';
import useDebounce from '../hooks/useDebounce.js';
import { useColorProfile } from '../context/ColorProfileContext.jsx';
import { getPalette } from '../utils/colorEngine/index.js';

const filterKeys = ['search', 'category', 'minPrice', 'maxPrice', 'rating', 'color', 'brand', 'sort', 'page', 'matchColors', 'avoidColors', 'matchColorNames', 'avoidColorNames'];
const readState = (params) => Object.fromEntries(filterKeys.map((key) => [key, params.get(key) || (key === 'sort' ? 'newest' : key === 'page' ? '1' : '')]));

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => readState(searchParams), [searchParams]);
  const { colorProfile } = useColorProfile();
  const [data, setData] = useState({ items: [], pagination: { page: 1, pages: 0, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);
  const [searchText, setSearchText] = useState(state.search);
  const debouncedSearch = useDebounce(searchText, 350);
  const [options, setOptions] = useState({ brands: [], categories: ['fashion', 'electronics', 'home', 'books'] });

  useEffect(() => setSearchText(state.search), [state.search]);
  useEffect(() => {
    let active = true;
    api.get('/products', { params: { limit: 100, sort: 'newest' } }).then((res) => {
      if (!active) return;
      const items = responseData(res)?.items || [];
      setOptions({ brands: [...new Set(items.map((p) => p.brand).filter(Boolean))].sort(), categories: [...new Set(items.map((p) => p.category).filter(Boolean))].sort() });
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const updateParams = useCallback((next, { replace = false } = {}) => {
    const params = new URLSearchParams(searchParams);
    for (const key of filterKeys) {
      const value = next[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') params.set(key, String(value));
      else params.delete(key);
    }
    setSearchParams(params, { replace });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (debouncedSearch !== state.search) updateParams({ ...state, search: debouncedSearch, page: 1 }, { replace: true });
  }, [debouncedSearch, state, updateParams]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const params = {};
    for (const key of filterKeys) {
      if (state[key] && !(key === 'matchColors' && state[key] === '1')) params[key] = state[key];
    }
    api.get('/products', { params, signal: controller.signal })
      .then((res) => setData(responseData(res) || { items: [], pagination: { page: 1, pages: 0, total: 0 } }))
      .catch((err) => { if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') setError(getErrorMessage(err, 'Products could not be loaded.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [state]);

  const clear = () => { setSearchText(''); setSearchParams({}); };
  const change = (next) => updateParams({ ...next, page: next.page || 1 });
  const colorFilterActive = Boolean(state.matchColors && state.matchColors !== '1');
  const removeColorFilter = () => change({ ...state, matchColors: '', avoidColors: '', matchColorNames: '', avoidColorNames: '', page: 1 });
  const toggleColorFilter = (enabled) => {
    if (!enabled) return removeColorFilter();
    const bestColors = colorProfile?.palette || [];
    const avoidColors = getPalette(colorProfile?.skinDepth, colorProfile?.undertone)?.avoidColors || [];
    change({ ...state, matchColors: bestColors.map(({ hex }) => hex).filter(Boolean).join(','), avoidColors: avoidColors.map(({ hex }) => hex).filter(Boolean).join(','), matchColorNames: bestColors.map(({ name }) => name).filter(Boolean).join(','), avoidColorNames: avoidColors.map(({ name }) => name).filter(Boolean).join(','), page: 1 });
  };

  return <main className="page-enter mx-auto max-w-7xl px-4 py-7 lg:px-6">
    <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">Shop the collection</p><h1 className="mt-1 text-3xl font-black text-slate-900">{state.category ? `${state.category[0].toUpperCase() + state.category.slice(1)} finds` : 'All products'}</h1><p className="mt-2 text-sm text-slate-500">{loading ? 'Finding the right picks…' : `${data.pagination?.total || 0} products to explore`}</p></div>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 sm:max-w-md"><FiSearch className="shrink-0 text-slate-400"/><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search products" aria-label="Search products" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/>{searchText && <button aria-label="Clear search" onClick={() => setSearchText('')}><FiX/></button>}</label><div className="flex items-center gap-2"><button onClick={() => setMobileFilters(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold lg:hidden"><FiFilter/> Filters</button><label className="flex items-center gap-2 text-sm text-slate-600">Sort by<select value={state.sort || 'newest'} onChange={(event) => change({ ...state, sort: event.target.value, page: 1 })} className="h-10 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-800"><option value="newest">Newest</option><option value="price">Price: low to high</option><option value="-price">Price: high to low</option><option value="rating">Top rated</option></select></label></div></div>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {colorProfile && <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-violet-800"><input type="checkbox" checked={colorFilterActive} onChange={(event) => toggleColorFilter(event.target.checked)} className="h-4 w-4 accent-violet-700"/>Matches my colors</label>}
      {colorFilterActive && <button type="button" onClick={removeColorFilter} className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-800">Matches my colors <FiX aria-hidden="true"/><span className="sr-only">Remove color filter</span></button>}
    </div>
    <div className="grid items-start gap-6 lg:grid-cols-[235px_minmax(0,1fr)]"><aside className="sticky top-36 hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:block"><ProductFilters values={state} options={options} onChange={change} onClear={clear}/></aside><section aria-live="polite">{error ? <EmptyState title="We couldn’t load products" message={error} action={<button onClick={() => setSearchParams(new URLSearchParams(searchParams))} className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Try again</button>}/> : loading ? <ProductGridSkeleton/> : data.items?.length ? <><div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{data.items.map((product) => <ProductCard key={product._id} product={product}/>)}</div><Pagination page={Number(data.pagination?.page) || 1} pages={Number(data.pagination?.pages) || 0} onChange={(page) => { change({ ...state, page }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}/></> : <EmptyState title={colorFilterActive ? 'No products match your palette' : 'No products found'} message={colorFilterActive ? 'No products matched your best colors after excluding your avoid colors. Clear the color filter to browse all products.' : 'Try changing your search or clearing one of your filters.'} action={colorFilterActive ? <button onClick={removeColorFilter} className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Clear color filter</button> : <button onClick={clear} className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Clear filters</button>}/>}</section></div>
    {mobileFilters && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close filters" className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileFilters(false)}/><aside className="absolute inset-y-0 right-0 w-[min(90vw,380px)] overflow-y-auto bg-white p-5 shadow-xl"><ProductFilters values={state} options={options} onChange={change} onClear={clear} onClose={() => setMobileFilters(false)}/></aside></div>}
  </main>;
}
