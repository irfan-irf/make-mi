import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const { Schema, model } = mongoose;

const addressSchema = new Schema({ fullName:String, phone:String, line1:String, line2:String, city:String, state:String, postalCode:String, country:String, isDefault:{type:Boolean,default:false} }, { _id:true });
const userSchema=new Schema({ name:{type:String,required:true,trim:true}, email:{type:String,required:true,unique:true,lowercase:true,trim:true,index:true}, password:{type:String,required:true,select:false}, role:{type:String,enum:['user','admin'],default:'user'}, addresses:[addressSchema], colorProfile:{ skinDepth:String, undertone:String, palette:[{name:String,hex:String}], updatedAt:Date } }, {timestamps:true});
userSchema.pre('save', async function(){ if(this.isModified('password')) this.password=await bcrypt.hash(this.password,12); });
const User=model('User',userSchema);
User.prototype.comparePassword=function(value){return bcrypt.compare(value,this.password);};
const Product=model('Product',new Schema({name:{type:String,required:true,index:'text'},description:{type:String,required:true},price:{type:Number,required:true,min:0},discountPrice:{type:Number,min:0},category:{type:String,required:true,index:true},brand:{type:String,index:true},images:[String],colors:[{name:String,hex:String,image:String}],sizes:[String],specifications:Schema.Types.Mixed,stock:{type:Number,default:0,min:0},ratings:{type:Number,default:0,min:0,max:5},numReviews:{type:Number,default:0},}, {timestamps:true}));
Product.schema.index({name:'text',description:'text',brand:'text'});
const Review=model('Review',new Schema({user:{type:Schema.Types.ObjectId,ref:'User',required:true},product:{type:Schema.Types.ObjectId,ref:'Product',required:true},rating:{type:Number,required:true,min:1,max:5},comment:{type:String,required:true,trim:true}}, {timestamps:true})); Review.schema.index({user:1,product:1},{unique:true});
const Cart=model('Cart',new Schema({user:{type:Schema.Types.ObjectId,ref:'User',required:true,unique:true},items:[{product:{type:Schema.Types.ObjectId,ref:'Product',required:true},quantity:{type:Number,min:1,default:1},color:String,size:String}]} ,{timestamps:true}));
const Wishlist=model('Wishlist',new Schema({user:{type:Schema.Types.ObjectId,ref:'User',required:true,unique:true},products:[{type:Schema.Types.ObjectId,ref:'Product'}]}, {timestamps:true}));
const Order=model('Order',new Schema({user:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},items:[{product:{type:Schema.Types.ObjectId,ref:'Product'},name:String,image:String,price:Number,quantity:Number,color:String,size:String}],shippingAddress:{type:Schema.Types.Mixed,required:true},paymentResult:{type:Schema.Types.Mixed,default:{}},totalPrice:{type:Number,required:true},status:{type:String,enum:['Placed','Packed','Shipped','Delivered','Cancelled'],default:'Placed'}}, {timestamps:true}));
export { User, Product, Review, Cart, Wishlist, Order };
