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


let productDetail = async function (req, res) {
  try {

    let data = req.query
    let fdata = {}
    fdata["isDeleted"] = false
    if (Object.keys(data).length === 0) return res.status(400).send({ status: false, message: "please use any filter to get product" })


    let { Size, name, price, priceSort, ...rest } = data
    if (Object.keys(rest).length > 0) return res.status(400).send({ ststus: false, message: "try (name, size and price,priceSort) to get product detail" })

    if (Size) {
      Size = Size.trim()
      let size1 = Size.split(",").map(ele => ele.toUpperCase())
      for (let i = 0; i < size1.length; i++) {
        if (!Size.includes(size1[i])) return res.status(400).send({ status: false, message: "please use correct Size" })
      }
      // if (!isValid(Size)) return res.status(400).send({ status: false, message: "please use size" })
      // if (!validSize(Size)) return res.status(400).send({ status: false, message: "size contain only ( S, XS, M, X, L, XXL, XL ) " })
      fdata["availableSizes"] = { $in: size1 }
    }

    if (name) {
      name = name.trim()
      if (!isValid(name)) return res.status(400).send({ status: false, message: "use correct formet " })
      // let findData= await productModel.find()
      // if(findData.title.includes(name)==true) 
      let regex = new RegExp(name, "i")
      fdata["title"] = { $regex: regex }
    }


    if (price) {
      let check = JSON.parse(price)
      console.log(check)
      if (Object.keys(check).length == 0) return res.status(400).send({ status: false, message: 'plz enter price fliter..' })

      if (check.priceGreaterThan) {
        fdata['price'] = { $gt: check.priceGreaterThan }
      }

      if (check.priceLessThan) {
        fdata['price'] = { $lt: check.priceLessThan }
      }

      if (check.priceGreaterThan && check.priceLessThan) {
        fdata['price'] = { $gt: check.priceGreaterThan, $lt: check.priceLessThan }
      }

      console.log(price)
      // price = JSON.parse(price)
    }
    let sort = {}

    if (priceSort) {
      if (!(priceSort == 1 || priceSort == -1)) return res.status(400).send({ status: false, message: 'plz give correct value for sotring ex=>  for:- ascending:1 & descending :-1' })
      sort['price'] = priceSort
    }

    const products = await productModel.find(fdata).sort(sort)
    //if (!Object.keys(products)>=0) return res.status(400).send({ status: false, message: "no data found" })
    return res.status(200).send({ status: true, message: 'Success', count: products.length, data: products })
  } catch (error) {

  }
}

const getProduct = async function (req, res) {
  try {
    let productId = req.params.productId
    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "check productId...." })

    let productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!productDetails) return res.status(404).send({ status: false, msg: "document not found" })
    return res.status(200).send({ status: true, data: productDetails })
  }
  catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}


const deleteProduct = async function (req, res) {
  try {

    let productId = req.params.productId

    if (!isValidRequestBody(productId)) return res.status(400).send({ status: false, message: "check productId...." })

    let check = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!check) return res.status(404).send({ status: false, message: "product not found" })

    let deletes = await productModel.findOneAndUpdate(
      {
        _id: productId
      }, {
      $set: {
        isDeleted: true,
        deletedAt: Date.now()
      }
    }, {
      new: true
    })
    return res.status(200).send({ status: true, message: "product Deleted Successfully....." })

  } catch (error) {
    return res.status(500).send({
      status: false,
      message: error.message
    })
  }

}
module.exports = { createProduct, deleteProduct, productDetail, getProduct }  
