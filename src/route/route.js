const express = require("express")
const router = express.Router()
const mid = require("../middleware/auth")
const { createUser,
    updateUser,
    loginUser,
    getUserDetails
} = require("../controller/userController")

const { createProduct, deleteProduct,getProduct } = require("../controller/productController")


//=================USER=============================
router.post("/user", createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile", mid.authentication, getUserDetails)
router.put("/user/:userId/profile", mid.authentication, mid.authorization, updateUser)

//=================PRODUCT=============================

router.post("/product", createProduct)
router.get("/products/:productId",getProduct)
router.delete("/products/:productId",deleteProduct)



module.exports = router