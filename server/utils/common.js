import jwt from 'jsonwebtoken';
export const send=(res,data,status=200)=>res.status(status).json({success:true,data});
export const tokenFor=user=>jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'});
export const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
