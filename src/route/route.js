const express = require("express")
const router = express.Router()
const mid = require("../middleware/auth")
const { createUser,
    updateUser,
    loginUser,
    getUserDetails
} = require("../controller/userController")

const { createProduct, deleteProduct, productDetail } = require("../controller/productController")


//=================USER=============================
router.post("/user", createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile", mid.authentication, getUserDetails)
router.put("/user/:userId/profile", mid.authentication, mid.authorization, updateUser)

//=================PRODUCT=============================

router.post("/product", createProduct)
router.get("/products",productDetail)
router.delete("/products/:productId",deleteProduct)


router.all("/*", function (req, res) {
    res.status(400).send({status: false, message: "Make Sure Your Endpoint is Correct !!!"})
})

module.exports = router