import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
export async function auth(req,res,next){try{const token=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):null;if(!token)return res.status(401).json({success:false,message:'Authentication required'});const p=jwt.verify(token,process.env.JWT_SECRET);req.user=await User.findById(p.id);if(!req.user)return res.status(401).json({success:false,message:'User not found'});next();}catch(e){next(e.name==='JsonWebTokenError'||e.name==='TokenExpiredError'?Object.assign(new Error('Invalid or expired token'),{status:401}):e)}}
export function admin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({success:false,message:'Admin access required'});next();}
