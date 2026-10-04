import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {User,Product,Review,Cart,Wishlist,Order} from '../models/index.js';
import { prepareIllustrationDirectory, writeProductSvg } from './productIllustrations.js';
await mongoose.connect(process.env.MONGO_URI);
if(process.argv.includes('--destroy')){await Promise.all([User.deleteMany({}),Product.deleteMany({}),Review.deleteMany({}),Cart.deleteMany({}),Wishlist.deleteMany({}),Order.deleteMany({})]);console.log('Seed data removed');await mongoose.disconnect();process.exit(0)}
const categories=[
 ['fashion','Threadline'],['electronics','NovaTech'],['home','Hearth & Home'],['books','Northstar Press']
];
const records=[];
const uploadsDirectory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../uploads/products');
await prepareIllustrationDirectory(uploadsDirectory);
const fashionColors=[['Red','#D62828'],['Navy','#14213D'],['Olive','#708238'],['Mustard','#D4A017'],['Maroon','#800000'],['Teal','#008080'],['Black','#222222'],['Cream','#F5F0E6']];
const apparel=['Everyday Cotton Shirt','Relaxed Fit Chinos','Linen Summer Dress','Merino Knit Sweater','Canvas Weekend Jacket','Classic Denim Jeans','Soft Jersey T-Shirt','Tailored Blazer','Pleated Midi Skirt','Lightweight Hoodie','Cotton Poplin Top','Utility Overshirt'];
for(let i=0;i<apparel.length;i++){const colors=fashionColors.slice(i%4,i%4+4).map(([name,hex])=>({name,hex}));for(const color of colors)color.image=await writeProductSvg(uploadsDirectory,apparel[i],'fashion',color);records.push({name:apparel[i],description:`Comfortable ${apparel[i].toLowerCase()} made for everyday wear.`,price:24+i*7,discountPrice:i%3===0?19+i*5:undefined,category:'fashion',brand:'Threadline',images:colors.map(color=>color.image),colors,sizes:['XS','S','M','L','XL'],stock:20+i});}
const products=[['Wireless Noise-Cancelling Headphones','electronics',129],['Bluetooth Speaker','electronics',59],['4K Streaming Stick','electronics',39],['Smart LED Desk Lamp','electronics',45],['Mechanical Keyboard','electronics',89],['Wireless Mouse','electronics',32],['Portable SSD 1TB','electronics',109],['Fitness Smartwatch','electronics',149],['USB-C Hub','electronics',49],['Mirrorless Camera Bag','electronics',79],['Ceramic Dinner Set','home',68],['Cotton Quilt Set','home',95],['Bamboo Cutting Board','home',24],['Tabletop Planter','home',22],['Woven Storage Basket','home',31],['Pour-Over Coffee Kit','home',42],['Scented Candle Trio','home',28],['Linen Cushion Cover','home',26],['Adjustable Book Stand','home',19],['Glass Water Carafe','home',35],['The Quiet Atlas','books',18],['Small Habits, Big Days','books',16],['A Field Guide to Color','books',24],['The Long Way Home','books',20],['Practical Everyday Cooking','books',29],['Stories from the Coast','books',17],['The Art of Clear Thinking','books',22],['Gardens in Small Spaces','books',26],['A Beginner’s Guide to Astronomy','books',21],['The Creative Notebook','books',14]];
for(let i=0;i<products.length;i++){const [name,category,price]=products[i];const image=await writeProductSvg(uploadsDirectory,name,category);records.push({name,description:`Thoughtfully selected ${name.toLowerCase()} for your home and everyday life.`,price,category,brand:categories.find(x=>x[0]===category)[1],images:[image],colors:[],sizes:[],specifications:{featured:i%5===0},stock:15+i});}
await Product.deleteMany({});await Product.insertMany(records);
let admin=await User.findOne({email:'admin@example.com'});if(!admin)admin=await User.create({name:'Make MI Admin',email:'admin@example.com',password:'Admin@123',role:'admin'});else{admin.name='Make MI Admin';admin.password='Admin@123';admin.role='admin';await admin.save()}
console.log(`Seeded admin and ${records.length} products`);await mongoose.disconnect();
