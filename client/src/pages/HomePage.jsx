import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight,FiArrowLeft, FiBookOpen, FiCpu, FiHome, FiShoppingBag } from 'react-icons/fi';
import api, { getErrorMessage, responseData } from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/Skeletons.jsx';
import { EmptyState } from '../components/Feedback.jsx';
import { useColorProfile } from '../context/ColorProfileContext.jsx';

const banners = [
  { eyebrow: 'Curated for your everyday', title: 'Find the good stuff.', body: 'A fresh edit of things worth keeping close.', action: 'Explore the collection', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=85', tint: 'from-slate-950/85 via-slate-900/55 to-transparent', category: '' },
  { eyebrow: 'Little comforts, big difference', title: 'Make home yours.', body: 'Thoughtful details for the spaces you love.', action: 'Shop for home', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1800&q=85', tint: 'from-slate-950/80 via-slate-900/45 to-transparent', category: 'home' },
  { eyebrow: 'Fresh picks for curious minds', title: 'A new chapter awaits.', body: 'Books and everyday essentials, picked for you.', action: 'Find your next read', image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1800&q=85', tint: 'from-slate-950/80 via-slate-900/45 to-transparent', category: 'books' },
];
const categories = [
  { name: 'Fashion', key: 'fashion', icon: FiShoppingBag, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80', detail: 'Everyday style, made easy' },
  { name: 'Electronics', key: 'electronics', icon: FiCpu, image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80', detail: 'Smarter daily essentials' },
  { name: 'Home', key: 'home', icon: FiHome, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80', detail: 'Comforts for your space' },
  { name: 'Books', key: 'books', icon: FiBookOpen, image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80', detail: 'Stories worth getting lost in' },
];

export default function HomePage() {
  const { colorProfile, loading: colorProfileLoading } = useColorProfile();
  const [products, setProducts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [slide, setSlide] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setSlide((current) => (current + 1) % banners.length), 6500); return () => window.clearInterval(timer); }, []);
  useEffect(() => { let active = true; api.get('/products', { params: { limit: 100, sort: 'newest' } }).then((res) => { if (active) setProducts(responseData(res)?.items || []); }).catch((err) => { if (active) setError(getErrorMessage(err, 'We could not load the shop right now.')); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const deals = useMemo(() => products.filter((p) => Number(p.discountPrice) > 0 && Number(p.discountPrice) < Number(p.price)).sort((a,b) => (b.price-b.discountPrice)-(a.price-a.discountPrice)).slice(0,4), [products]);
  const featured = useMemo(() => [...products].sort((a,b) => (b.ratings||0)-(a.ratings||0) || (b.numReviews||0)-(a.numReviews||0)).slice(0,8), [products]);
  const active = banners[slide];
  return <div className="page-enter mx-auto max-w-7xl px-4 pb-14 pt-4 lg:px-6">
    <section className="relative isolate min-h-[350px] overflow-hidden rounded-2xl bg-slate-800 sm:min-h-[430px]" aria-label="Featured collection">
      <img key={active.image} src={active.image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover"/><div className={`absolute inset-0 -z-10 bg-gradient-to-r ${active.tint}`}/>
      <div className="flex min-h-[350px] max-w-2xl flex-col justify-center px-6 py-12 text-white sm:min-h-[430px] sm:px-12"><p className="text-xs font-bold uppercase tracking-[.22em] text-amber sm:text-sm">{active.eyebrow}</p><h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">{active.title}</h1><p className="mt-4 max-w-lg text-base text-slate-100 sm:text-lg">{active.body}</p><Link to={`/products${active.category ? `?category=${active.category}` : ''}`} className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-amber px-5 py-3 font-bold text-navy hover:bg-amber-300">{active.action}<FiArrowRight/></Link></div>
      <button onClick={() => setSlide((slide+banners.length-1)%banners.length)} className="absolute bottom-5 right-24 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30" aria-label="Previous banner"><FiArrowLeft/></button><button onClick={() => setSlide((slide+1)%banners.length)} className="absolute bottom-5 right-11 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30" aria-label="Next banner"><FiArrowRight/></button>
      <div className="absolute bottom-8 left-6 flex gap-2 sm:left-12">{banners.map((b,i)=><button key={b.title} onClick={()=>setSlide(i)} aria-label={`Show slide ${i+1}`} aria-current={slide===i} className={`h-1.5 rounded-full transition-all ${slide===i?'w-8 bg-amber':'w-3 bg-white/60'}`}/>)}</div>
    </section>

    {!colorProfileLoading && !colorProfile && <Link to="/color-match" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 text-violet-950 hover:bg-violet-100"><span><strong>Find colors that feel like you.</strong><span className="ml-2 text-sm text-violet-800">Try Make MI Color Match.</span></span><span className="font-bold">Find My Colors <FiArrowRight className="inline"/></span></Link>}

    <section className="mt-10"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">Browse by interest</p><h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">A little bit of everything</h2></div><Link className="hidden text-sm font-semibold text-sky-700 hover:underline sm:block" to="/products">Shop all</Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{categories.map(({name,key,icon:Icon,image,detail})=><Link key={key} to={`/products?category=${key}`} className="group relative min-h-40 overflow-hidden rounded-xl bg-slate-700 sm:min-h-56"><img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent"/><div className="absolute bottom-0 left-0 p-4 text-white sm:p-5"><Icon className="mb-2 text-amber" size={21}/><h3 className="text-lg font-bold">{name}</h3><p className="mt-0.5 text-xs text-white/80">{detail}</p></div></Link>)}</div></section>

    <section className="mt-12"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-rose-700">Today’s finds</p><h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Deals of the day</h2><p className="mt-1 text-sm text-slate-500">A little more value on things you’ll love.</p></div><Link to="/products?sort=newest" className="text-sm font-semibold text-sky-700 hover:underline">See all deals</Link></div>
      {error ? <EmptyState title="We hit a small snag" message={error} action={<button onClick={()=>window.location.reload()} className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Try again</button>}/> : loading ? <ProductGridSkeleton count={4}/> : deals.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">{deals.map((p)=><ProductCard key={p._id} product={p}/>)}</div> : <div className="rounded-xl border border-slate-200 bg-white p-7 text-sm text-slate-500">No discounted products are available right now. Check back soon.</div>}</section>

    <section className="mt-12"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">Picked for browsing</p><h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Featured finds</h2></div><Link to="/products" className="text-sm font-semibold text-sky-700 hover:underline">Browse everything</Link></div>{error ? null : loading ? <ProductGridSkeleton count={8}/> : featured.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">{featured.map((p)=><ProductCard key={p._id} product={p}/>)}</div> : <div className="rounded-xl border border-slate-200 bg-white p-7 text-sm text-slate-500">There are no products to feature yet.</div>}</section>
  </div>;
}
