import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard.jsx';
import { EmptyState, PageSpinner } from '../components/Feedback.jsx';
import { ProductGridSkeleton } from '../components/Skeletons.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getErrorMessage } from '../services/api.js';

export default function WishlistPage(){
  const {products,loading,error,removeProduct,refresh}=useWishlist();const {addItem}=useCart();const [busy,setBusy]=useState('');
  const remove=async(product)=>{setBusy(product._id);try{await removeProduct(product._id);toast.success('Removed from your wishlist.')}catch(err){toast.error(getErrorMessage(err,'Could not remove this product.'))}finally{setBusy('')}};
  const move=async(product)=>{setBusy(product._id);try{await addItem(product,{quantity:1,color:product.colors?.[0]?.name,size:product.sizes?.[0]});await removeProduct(product._id);toast.success('Moved to your cart.')}catch(err){toast.error(getErrorMessage(err,'Could not move this item to your cart.'))}finally{setBusy('')}};
  if(loading)return <div className="mx-auto max-w-7xl px-4 py-8"><ProductGridSkeleton count={4}/></div>;
  if(error)return <div className="mx-auto max-w-7xl px-4 py-6"><EmptyState title="Your wishlist didn’t load" message={error} action={<button onClick={()=>refresh().catch(()=>{})} className="mt-4 rounded-lg bg-navy px-4 py-2 font-semibold text-white">Try again</button>}/></div>;
  if(!products.length)return <div className="mx-auto max-w-7xl px-4 py-6"><EmptyState title="Your wishlist is waiting" message="Tap the heart on anything you love and it will be saved here." action={<Link to="/products" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber px-5 py-3 font-bold text-navy">Explore products <FiArrowRight/></Link>}/></div>;
  return <main className="page-enter mx-auto max-w-7xl px-4 py-7 lg:px-6"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-rose-700">Saved for later</p><h1 className="mt-1 flex items-center gap-2 text-3xl font-black">My wishlist <FiHeart className="text-rose-500"/></h1></div><div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{products.map((product)=><div className="relative" key={product._id}><ProductCard product={product}/><div className="grid grid-cols-2 gap-2 px-1 pt-2"><button disabled={busy===product._id} onClick={()=>move(product)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber px-2 py-2 text-xs font-bold text-navy hover:bg-amber-300 disabled:opacity-50"><FiShoppingCart/> Move to cart</button><button disabled={busy===product._id} onClick={()=>remove(product)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:text-rose-700 disabled:opacity-50"><FiTrash2/> Remove</button></div></div>)}</div></main>;
}
