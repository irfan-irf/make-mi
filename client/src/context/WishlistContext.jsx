import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import api, { getErrorMessage, responseData } from '../services/api.js';

const WishlistContext=createContext(null);
const getProducts=(value)=>Array.isArray(value?.products)?value.products.filter(Boolean):[];
export function WishlistProvider({children}){
  const {authReady,isAuthenticated}=useAuth();const [products,setProducts]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const refresh=useCallback(async()=>{if(!isAuthenticated){setProducts([]);return [];}const next=getProducts(responseData(await api.get('/wishlist')));setProducts(next);setError('');return next;},[isAuthenticated]);
  useEffect(()=>{if(!authReady)return;let active=true;if(!isAuthenticated){setProducts([]);setError('');setLoading(false);return()=>{active=false;};}setLoading(true);api.get('/wishlist').then((res)=>{if(active){setProducts(getProducts(responseData(res)));setError('');}}).catch((err)=>{if(active){setProducts([]);setError(getErrorMessage(err,'Your wishlist could not be loaded.'));}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[authReady,isAuthenticated]);
  const isSaved=useCallback((id)=>products.some((product)=>String(product._id)===String(id)),[products]);
  const toggleProduct=useCallback(async(product)=>{const id=String(product?._id||product?.id||product);if(!id)throw new Error('This product is unavailable.');if(isSaved(id)){await api.delete(`/wishlist/${id}`);await refresh();return false;}const data=responseData(await api.post('/wishlist',{product:id}));setProducts(getProducts(data));return true;},[isSaved,refresh]);
  const removeProduct=useCallback(async(id)=>{await api.delete(`/wishlist/${id}`);await refresh();},[refresh]);
  const value=useMemo(()=>({products,count:products.length,loading,error,isSaved,toggleProduct,removeProduct,refresh}),[products,loading,error,isSaved,toggleProduct,removeProduct,refresh]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
export function useWishlist(){const value=useContext(WishlistContext);if(!value)throw new Error('useWishlist must be used within WishlistProvider');return value;}
