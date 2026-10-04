import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';
import Rating from './Rating.jsx';
import MatchBadge from './MatchBadge.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

export function productImage(product, image = product?.images?.[0]) {
  const img = image;
  if (!img) return 'https://placehold.co/640x640/f1f5f9/64748b?text=Make%20MI';
  if (/^https?:\/\//i.test(img)) return img;
  const imagePath = img.startsWith('/') ? img : `/${img}`;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  try {
    const apiUrl = new URL(apiBase, window.location.origin);
    return /^https?:\/\//i.test(apiBase) ? `${apiUrl.origin}${imagePath}` : imagePath;
  } catch {
    return imagePath;
  }
}

const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);
export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth(); const navigate = useNavigate(); const location=useLocation();
  const { addItem }=useCart();const {isSaved,toggleProduct}=useWishlist();
  const discount = product.discountPrice > 0 && product.discountPrice < product.price ? Math.round((1 - product.discountPrice / product.price) * 100) : 0;
  const currentPrice = discount ? product.discountPrice : product.price;
  const addWishlist = async () => {
    if (!isAuthenticated) { toast('Sign in to save items.'); navigate('/login',{state:{from:{pathname:location.pathname+location.search}}}); return; }
    try { const added=await toggleProduct(product);toast.success(added?'Added to your wishlist.':'Removed from your wishlist.'); }
    catch (error) { toast.error(getErrorMessage(error, 'Could not update your wishlist.')); }
  };
  const quickAdd=async()=>{try{await addItem(product,{quantity:1,color:product.colors?.[0]?.name,size:product.sizes?.[0]});toast.success('Added to your cart.')}catch(error){toast.error(getErrorMessage(error,'Could not add this item to your cart.'))}};
  return <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-soft">
    <div className="relative"><Link to={`/product/${product._id}`} className="relative block aspect-square overflow-hidden bg-slate-100"><img src={productImage(product)} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.src = 'https://placehold.co/640x640/f1f5f9/64748b?text=Make%20MI'; }}/>{discount > 0 && <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">-{discount}%</span>}</Link><button onClick={addWishlist} aria-label={`${isSaved(product._id)?'Remove':'Save'} ${product.name} ${isSaved(product._id)?'from':'to'} wishlist`} aria-pressed={isSaved(product._id)} className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm transition ${isSaved(product._id)?'text-rose-600':'text-slate-700 hover:text-rose-600'}`}><FiHeart className={isSaved(product._id)?'fill-current':''}/></button></div>
    <div className="flex flex-1 flex-col p-3 sm:p-4"><p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-400">{product.brand || product.category}</p><Link to={`/product/${product._id}`} className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900 hover:text-sky-700">{product.name}</Link><div className="mt-2"><Rating value={product.ratings} count={product.numReviews} compact/></div><div className="mt-2 flex items-baseline gap-2"><strong className="text-lg text-slate-900">{money(currentPrice)}</strong>{discount > 0 && <del className="text-xs text-slate-400">{money(product.price)}</del>}</div><div className="mt-auto flex items-center justify-between gap-2 pt-3"><MatchBadge product={product}/><button disabled={!product.stock} onClick={quickAdd} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-amber px-3 py-2 text-xs font-bold text-navy hover:bg-amber-300 disabled:opacity-50"><FiShoppingCart/>Quick add</button></div></div>
  </article>;
}
