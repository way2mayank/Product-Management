const express = require("express")
const router = express.Router()
const mid = require("../middleware/auth")

const { createUser,updateUser,loginUser,getUserDetails} = require("../controller/userController")
const { createProduct, deleteProduct, productDetail, updateProduct,getProduct } = require("../controller/productController")
const { createCart, updateCart, deleteCart, getCart } = require("../controller/cartController")
const { createOrder, updateOrder }= require("../controller/orderController")

//=================USER=============================
router.post("/register", createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile", mid.authentication, getUserDetails)
router.put("/user/:userId/profile", mid.authentication, mid.authorization, updateUser)

// =================PRODUCT=============================

router.post("/products", createProduct)
router.get("/products/:productId",getProduct )
router.get("/products",productDetail)
router.put("/products/:productId",updateProduct)
router.delete("/products/:productId",deleteProduct)


// =================CART=============================

router.post("/users/:userId/cart",createCart)
router.get("/users/:userId/cart",mid.authentication,getCart)
router.put("/users/:userId/cart",mid.authentication, mid.authorization,updateCart)
router.delete("/users/:userId/cart",mid.authentication, mid.authorization,deleteCart)


// =================ORDER=============================


router.post("/users/:userId/orders",mid.authentication, mid.authorization,createOrder)
router.put("/users/:userId/orders",mid.authentication, mid.authorization,updateOrder)



router.all("/*", function (req, res) {
    res.status(400).send({status: false, message: "Make Sure Your Endpoint is Correct !!!"})
})

module.exports = router