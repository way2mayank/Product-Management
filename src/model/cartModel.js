const mongoose=require("mongoose")
const productModel=require("./productModel")
const userModel =require("./userModel")
const ObjectId= mongoose.Schema.Types.ObjectId



const cartSchema = new mongoose.Schema(

{
  userId: {type:ObjectId, ref: "user", required:true, unique:true},
  items:[ {
    productId: {type:ObjectId, ref:"product", required:true},
    quantity: {type:Number, required:true,default:1}
  }],
  totalPrice: {type:Number, required:true},
//   "Holds total price of all the items in the cart"
  totalItems: {type:Number, required:true}, 
//   Holds total number of items in the cart
},{timestamps:true})
module.exports = mongoose.model("cart",cartSchema)