import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';
import api, { getErrorMessage, responseData } from '../services/api.js';

const CartContext = createContext(null);
export const GUEST_CART_KEY = 'make-mi_guest_cart';
const productId = (product) => String(product?._id || product?.id || product || '');
const variantKey = (item) => `${productId(item.product)}::${item.color || ''}::${item.size || ''}`;
const readGuest = () => { try { const value=JSON.parse(localStorage.getItem(GUEST_CART_KEY)||'[]'); return Array.isArray(value)?value:[]; } catch { return []; } };
const writeGuest = (items) => { if(items.length)localStorage.setItem(GUEST_CART_KEY,JSON.stringify(items));else localStorage.removeItem(GUEST_CART_KEY); };
const unwrap = (cart) => Array.isArray(cart?.items)?cart.items.filter((item)=>item.product):[];

export function CartProvider({ children }) {
  const { authReady, isAuthenticated, user } = useAuth();
  const [items,setItems]=useState(readGuest);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const syncUser=useRef(null);
  const syncAttempt=useRef(0);

  const refresh=useCallback(async()=>{
    if(!isAuthenticated){const guest=readGuest();setItems(guest);return guest;}
    const cart=responseData(await api.get('/cart'));
    const next=unwrap(cart);setItems(next);setError('');return next;
  },[isAuthenticated]);

  useEffect(()=>{
    if(!authReady)return;
    if(!isAuthenticated){syncUser.current=null;syncAttempt.current+=1;setItems(readGuest());setError('');setLoading(false);return;}
    const key=String(user?.id||user?._id||'authenticated');
    if(syncUser.current===key)return;
    syncUser.current=key;const attempt=++syncAttempt.current;setLoading(true);setError('');
    (async()=>{
      try{
        let remote=unwrap(responseData(await api.get('/cart')));
        let pending=readGuest();let merged=0;
        for(let index=0;index<pending.length;){
          const guest=pending[index];const id=productId(guest.product);const stock=Number(guest.product?.stock)||0;
          const already=remote.find((item)=>variantKey(item)===variantKey(guest));
          const available=Math.max(0,stock-(Number(already?.quantity)||0));
          const quantity=Math.min(Math.max(0,Number(guest.quantity)||0),available);
          if(!id||!quantity){index+=1;continue;}
          try{
            const payload={product:id,quantity,...(guest.color?{color:guest.color}:{}),...(guest.size?{size:guest.size}:{})};
            const response=await api.post('/cart',payload);remote=unwrap(responseData(response));
            pending=pending.filter((_,pendingIndex)=>pendingIndex!==index);writeGuest(pending);merged+=1;
          }catch{index+=1;}
        }
        if(syncAttempt.current===attempt){setItems(remote);if(pending.length)toast.error('Some saved guest items could not be merged. Review your cart before checkout.');else if(merged)toast.success(`Merged ${merged} guest ${merged===1?'item':'items'} into your cart.`);}
      }catch(err){if(syncAttempt.current===attempt){setError(getErrorMessage(err,'Your cart could not be loaded.'));setItems(readGuest());}}
      finally{if(syncAttempt.current===attempt)setLoading(false);}
    })();
  },[authReady,isAuthenticated,user]);

  const addItem=useCallback(async(product,options={})=>{
    const id=productId(product);const quantity=Math.max(1,Number(options.quantity)||1);const color=options.color||'';const size=options.size||'';
    if(!id)throw new Error('This product is unavailable.');
    if(isAuthenticated){
      const result=responseData(await api.post('/cart',{product:id,quantity,...(color?{color}:{}),...(size?{size}:{})}));
      const next=unwrap(result);setItems(next);setError('');return next;
    }
    const guest=readGuest();const key=`${id}::${color}::${size}`;const index=guest.findIndex((item)=>variantKey(item)===key);const stock=Number(product?.stock)||0;
    if(stock<1)throw new Error('This product is out of stock.');
    if(index>=0){guest[index]={...guest[index],quantity:Math.min(stock,(Number(guest[index].quantity)||0)+quantity)};}
    else guest.push({product,quantity:Math.min(stock,quantity),...(color?{color}:{}),...(size?{size}:{})});
    writeGuest(guest);setItems(guest);return guest;
  },[isAuthenticated]);

  const updateQuantity=useCallback(async(item,nextQuantity)=>{
    const quantity=Math.max(1,Number(nextQuantity)||1);
    if(isAuthenticated){if(!item._id)throw new Error('Cart item id is missing.');const data=responseData(await api.put(`/cart/${item._id}`,{quantity}));setItems(unwrap(data));return;}
    const guest=readGuest().map((current)=>variantKey(current)===variantKey(item)?{...current,quantity:Math.min(Number(current.product?.stock)||quantity,quantity)}:current);writeGuest(guest);setItems(guest);
  },[isAuthenticated]);

  const removeItem=useCallback(async(item)=>{
    if(isAuthenticated){if(!item._id)throw new Error('Cart item id is missing.');await api.delete(`/cart/${item._id}`);await refresh();return;}
    const guest=readGuest().filter((current)=>variantKey(current)!==variantKey(item));writeGuest(guest);setItems(guest);
  },[isAuthenticated]);

  const clearCart=useCallback(async({remote=true}={})=>{
    if(isAuthenticated&&remote)await api.delete('/cart');writeGuest([]);setItems([]);setError('');
  },[isAuthenticated]);

  const itemCount=items.reduce((sum,item)=>sum+(Number(item.quantity)||0),0);
  const value=useMemo(()=>({items,itemCount,loading,error,addItem,updateQuantity,removeItem,clearCart,refresh}),[items,itemCount,loading,error,addItem,updateQuantity,removeItem,clearCart,refresh]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(){const value=useContext(CartContext);if(!value)throw new Error('useCart must be used within CartProvider');return value;}
