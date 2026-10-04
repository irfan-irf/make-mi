import './dnsFix.js';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import connectDB from './config/db.js';
import routes from './routes/index.js';
import {notFound,errorHandler} from './middleware/errors.js';
const app=express();const root=path.dirname(fileURLToPath(import.meta.url));
const uploadRoot=path.join(root,'uploads');const productUploadRoot=path.join(uploadRoot,'products');
mkdirSync(productUploadRoot,{recursive:true});
const allowedOrigins=(process.env.CLIENT_URL||'').split(',').map(origin=>origin.trim()).filter(Boolean);
const corsOptions={origin(origin,callback){if(!allowedOrigins.length||!origin||allowedOrigins.includes(origin))return callback(null,true);return callback(new Error('Not allowed by CORS'));},credentials:true};
app.use(helmet());app.use(cors(corsOptions));app.use(express.json({limit:'1mb'}));app.use(express.urlencoded({extended:true}));
// The Vite client and API use different localhost ports, so uploaded images
// must be allowed to load cross-origin even though the API keeps Helmet enabled.
app.use('/uploads',helmet.crossOriginResourcePolicy({policy:'cross-origin'}),express.static(uploadRoot));
app.use('/api/auth',rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:true,legacyHeaders:false}));app.use('/api',routes);app.use(notFound);app.use(errorHandler);
const port=process.env.PORT||5000;
connectDB().then(()=>app.listen(port,()=>console.log(`API listening on ${port}`))).catch(err=>{console.error(err);process.exit(1)});
