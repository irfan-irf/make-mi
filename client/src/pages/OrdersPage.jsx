import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiPackage } from 'react-icons/fi';
import api, { getErrorMessage, responseData } from '../services/api.js';
import { EmptyState, PageSpinner } from '../components/Feedback.jsx';
import { productImage } from '../components/ProductCard.jsx';
import { formatDate, money } from '../utils/shop.js';

const statusClass={Placed:'bg-sky-100 text-sky-800',Packed:'bg-violet-100 text-violet-800',Shipped:'bg-amber-100 text-amber-800',Delivered:'bg-emerald-100 text-emerald-800',Cancelled:'bg-rose-100 text-rose-800'};
export default function OrdersPage(){
  const [orders,setOrders]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const load=()=>{setLoading(true);setError('');api.get('/orders/my').then((res)=>setOrders(responseData(res)||[])).catch((err)=>setError(getErrorMessage(err,'Your orders could not be loaded.'))).finally(()=>setLoading(false));};
  useEffect(()=>{load()},[]);
  if(loading)return <div className="mx-auto max-w-5xl px-4 py-8"><PageSpinner label="Loading your orders…"/></div>;
  if(error)return <div className="mx-auto max-w-5xl px-4 py-6"><EmptyState title="Orders unavailable" message={error} action={<button onClick={load} className="mt-4 rounded-lg bg-navy px-4 py-2 font-semibold text-white">Try again</button>}/></div>;
  if(!orders.length)return <div className="mx-auto max-w-5xl px-4 py-6"><EmptyState title="No orders yet" message="When you place your first order, you can track it here." action={<Link to="/products" className="mt-4 inline-flex rounded-lg bg-amber px-5 py-3 font-bold text-navy">Browse products</Link>}/></div>;
  return <main className="page-enter mx-auto max-w-5xl px-4 py-7"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">Your purchases</p><h1 className="mt-1 text-3xl font-black">Your orders</h1></div><div className="space-y-4">{orders.map((order)=><article key={order._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5"><div><p className="text-xs text-slate-500">Order placed</p><p className="text-sm font-semibold">{formatDate(order.createdAt)}</p></div><div><p className="text-xs text-slate-500">Total</p><p className="text-sm font-bold">{money(order.totalPrice)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[order.status]||'bg-slate-100 text-slate-700'}`}>{order.status}</span><Link to={`/orders/${order._id}`} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:underline">Order details <FiArrowRight/></Link></div><div className="flex items-center gap-3 overflow-x-auto p-4 sm:p-5">{order.items?.map((item,index)=><Link title={item.name} key={`${item.product}-${index}`} to={`/orders/${order._id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100"><img src={productImage(null,item.image)} alt={item.name||'Ordered product'} className="h-full w-full object-cover"/></Link>)}{!order.items?.length&&<FiPackage className="text-slate-400"/>}<span className="ml-auto shrink-0 text-xs text-slate-500">{order.items?.length||0} {order.items?.length===1?'item':'items'}</span></div></article>)}</div></main>;
}
