const productModel=require("../model/productModel")
const mongoose = require("mongoose")

// ### DELETE /products/:productId
// - Deletes a product by product id if it's not already deleted
// - __Response format__
//   - _**On success**_ - Return HTTP status 200. The response should be a JSON object like [this](#successful-response-structure)
//   - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

const deleteProduct = async function (req, res) {
    try {
      let productId = req.params.productId;
    
      let deletedata = await productModel.findByIdAndUpdate(
        productId,
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true }
      );
      res.status(200).send({ status: true, message: "SuccessFully Deleted" });
    } catch (error) {
      res.status(500).send({ status: false, message: error.message });
    }
  }


module.exports ={deleteProduct}