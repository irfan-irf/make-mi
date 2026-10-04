export const money = (value) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(value)||0);
export const unitPrice = (product) => Number(product?.discountPrice)>0&&Number(product.discountPrice)<Number(product.price)?Number(product.discountPrice):Number(product?.price)||0;
export const itemKey = (item) => `${item?._id||item?.product?._id||item?.product}::${item?.color||''}::${item?.size||''}`;
export const formatDate = (value) => value?new Date(value).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'—';
