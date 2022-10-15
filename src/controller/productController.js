const productModel = require("../model/productModel")
//const { isValidRequestBody } = require("../validators/validation")
const mongoose = require("mongoose")
const { uploadFile } = require('../validators/aws')
const {
  isValid,
  isValidRequestBody,
  isValidObjectId,
  nameFormet,
  validSize

} = require("../validators/validation")




const createProduct = async (req, res) => {
  try {

    let data = req.body;
    let files = req.files;


    if (Object.keys(data).length == 0)
      return res.status(400).send({ status: false, message: "please provide data" });

    let { title, description, price, currencyId, currencyFormat, style, availableSizes, installments, productImage } = data

    if (!isValid(title))
      return res.status(400).send({ status: false, message: "title is required." });
    if (!nameFormet(title))
      return res.status(400).send({ status: false, message: "title should be in alphabetical" });

    let checkTitle = await productModel.findOne({ title });
    if (checkTitle)
      return res.status(400).send({ status: false, msg: "title already exist" });

    if (!isValid(description))
      return res.status(400).send({ status: false, message: "description is required." });
    if (!isValid(description))
      return res.status(400).send({ status: false, message: "description should be in alphabetical" });

    if (!isValid(price))
      return res.status(400).send({ status: false, message: "price is required." });
    if (!/^[0-9 .]+$/.test(price))
      return res.status(400).send({ status: false, message: "price must be in numeric" })

    if (currencyId && currencyId !== "INR")
      return res.status(400).send({ status: false, message: "enter INR currency only" });

    if (currencyFormat && currencyFormat !== "₹")
      return res.status(400).send({ status: false, message: "enter indian currency format i.e '₹' " });


    // if (!isValid(availableSizes))
    //   return res.status(400).send({ status: false, message: "avilableSizes is required" })
    if (availableSizes) {
      availableSizes = availableSizes.toUpperCase()
      let size = availableSizes.split(',').map(x => x.trim())

      for (let i = 0; i < size.length; i++) {
        if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i]))) return res.status(400).send({ status: false, message: `availableSizes should have only these Sizes ['S' || 'XS'  || 'M' || 'X' || 'L' || 'XXL' || 'XL']` })

      }
    }
    // if (!validSize(availableSizes)) return res.status(400).send({ status: false, message: "size contain only ( S, XS, M, X, L, XXL, XL ) " })

    if (installments)
      if (isNaN(installments)) return res.status(400).send({ status: false, message: "installments should be number only" })


    //if (files.length == 0) return res.status(404).send({ status: false, message: "please enter profileImage" })

    if (files && files.length > 0) {
      let uploadedFileURL = await uploadFile(files[0])

      data['profileImage'] = uploadedFileURL

    }


    let createdproduct = await productModel.create(data)
    return res.status(201).send({ satus: true, message: "product create successfully", data: createdproduct })


  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
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


// Updates a product by changing at least one or all fields
// Check if the productId exists (must have isDeleted false and is present in collection). If it doesn't, return an HTTP status 404 with a response body like this
// Response format
// On success - Return HTTP status 200. Also return the updated product document. The response should be a JSON object like this
// On error - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like this

const updateProduct = async function (req, res) {
  try {
    let productId = req.params.productId;
    let data = req.body;

    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid productId" })

    let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!checkProduct) return res.status(404).send({ status: false, msg: "Data not found" })

    let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments, isDeleted } = data


    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "please provide data" });

    if (title)
      if (!isValid(title)) return res.status(400).send({ status: false, message: "can't empty title field" })
    if (!nameFormet(title)) return res.status(400).send({ status: false, message: "title  must be alphabetic characters" })

    let isTitlePresent = await productModel.findOne({ title })
    if (isTitlePresent) return res.status(400).send({ status: false, message: "title is already present" })

    if (description)
      if (!isValid(description)) return res.status(400).send({ status: false, message: "description  must be alphabetic characters" })

    if (price)
      if (!/^[0-9 .]+$/.test(price)) return res.status(400).send({ status: false, message: "price must be in numeric" })

    if (currencyId)
      if ((currencyId != "INR")) return res.status(400).send({ status: false, message: "currency Id must be INR" })

    if (currencyFormat)
      if ((currencyFormat != "₹")) return res.status(400).send({ status: false, message: "currency formet must be ₹ " })

    if (style)
      if (!isValid(style)) return res.status(400).send({ status: false, message: "style must be alphabetic characters" })

    if (isFreeShipping)
      if (!typeof (isFreeShipping) == Boolean) return res.status(400).send({ status: false, message: "isFreeShipping must be  Boolean" })

    if (isDeleted)
      return res.status(400).send({ status: false, message: "can't update isDeleted field" })
    //AVILABLESIZE
    // REMAIN
    if (availableSizes) {
      availableSizes = availableSizes.toUpperCase()
      let size = availableSizes.split(',').map(x => x.trim())

      for (let i = 0; i < size.length; i++) {
        if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i]))) return res.status(400).send({ status: false, message: `availableSizes should have only these Sizes ['S' || 'XS'  || 'M' || 'X' || 'L' || 'XXL' || 'XL']` })

      }
      // if(!validSize(availableSizes)) 
      // data['$addToSet'] = {}
      // data['$addToSet']['availableSizes'] = size
      data['availableSizes'] = size

    }

    if (installments)
      if (!/^[0-9 ]+$/.test(installments)) return res.status(400).send({ status: false, message: "installments must be in numeric" })

    let files = req.files;
    if (files && files.length > 0) {
      let fileUrl = await uploadFile(files[0]);
      data.productImage = fileUrl;
    }

    let updatedData = await productModel.findOneAndUpdate({ _id: productId }, data, { new: true });
    return res.status(200).send({ status: true, message: "product details updated", data: updatedData, });
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};


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


module.exports = { createProduct, productDetail, getProduct, deleteProduct, updateProduct }  
