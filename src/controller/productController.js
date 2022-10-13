const productModel = require("../model/productModel")
//const { isValidRequestBody } = require("../validators/validation")
const mongoose = require("mongoose")
const { uploadFile } = require('../validators/aws')
const {
  isValid,
  isValidEmail,
  isValidNumber,
  isValidRequestBody,
  isValidObjectId,
  isValidPincode,
  isValidPassword,
  nameFormet
} = require("../validators/validation")









let createProduct = async function (req, res) {
  try {


    let data = req.body
    let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments, deletedAt, isDeleted } = data
    //checking  body empty
    if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: "please provide  details" })

    //title
    if (!isValid(title)) return res.status(400).send({ status: false, message: "please write title in correct way" })
    let isTitlePresent = await productModel.findOne({ title })
    if (isTitlePresent) return res.status(400).send({ status: false, message: "Title is already present" })

    //description
    if (!isValid(description)) return res.status(400).send({ status: false, message: "please write description in correct way" })
    //price
    if (!isValid(price)) return res.status(400).send({ status: false, message: "please write price in correct way" })

    //currencyId
    if (!isValid(currencyId)) return res.status(400).send({ status: false, message: "please write currencyId in correct way" })
    if (currencyId != "INR") return res.status(400).send({ status: false, message: "currencyId formrt is INR" })

    //currencyFormat
    if (!isValid(currencyFormat)) return res.status(400).send({ status: false, message: "please write currencyFormat in correct way" })
    if (currencyFormat != "₹") return res.status(400).send({ status: false, message: "currencyFormat should be in :  ₹" })

    if (!isValid(availableSizes)) return res.status(400).send({ status: false, message: "isFreeShipping is required" })


    //     if (!isValid(isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping is required" })
    //if (!productImage) return res.status(400).send({ status: false, message: "productImage is required" })

    let files = req.files
    //console.log(files)
    if (files && files.length > 0) {
      let uploadedFileURL = await uploadFile(files[0])

      data.productImage = uploadedFileURL

    }
    let createData = await productModel.create(data)

    res.send({ status: true, data: createData })

  } catch (error) {
    res.status(500).send({ status: false, message: error.message })
  }

}
// GET /products/:productId

const getProduct =async function(req,res){
    try{
let productId=req.params.productId
if(!isValidObjectId(productId)) return res.status(400).send({status:false, message:"check productId...."})

let productDetails =await productModel.findOne({_id:productId,isDeleted:false})
if(!productDetails)return res.status(404).send({status:false,msg:"document not found"})
return res.status(200).send({status:true,data:productDetails})
    }
    catch(error){
       return res.status(500).send({status:false,message:error.message})
    }
}





const deleteProduct = async function (req, res) {
  try {

    let productId = req.params.productId

    if(!isValidObjectId(productId)) return res.status(400).send({status:false, message:"check productId...."})

    let check = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!check) return res.status(404).send({ status: false, message: "product not found" })

    let deletes = await productModel.findOneAndUpdate({
      _id: productId
    }, {
      $set: {
        isDeleted: true,
        deletedAt: Date.now()
      }
    }, {
      new: true
    })
    return res.status(200).send({ status: true, message: "product Deleted Successfully" })

  } catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message
    })
  }

}
module.exports = { createProduct, deleteProduct,getProduct }  
