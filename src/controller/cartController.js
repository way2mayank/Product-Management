const cartmodel = require("../model/cartModel")
const productModel = require("../model/productModel")
const userModel = require("../model/userModel")

const { isValid, isValidRequestBody, isValidObjectId, nameFormet } = require("../validators/validation")

const createCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        let data = req.body;
        const { productId, cartId } = data;

        // validation for empty body
        if (!isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Request body cannot remain empty" });

        // validation for userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });

        // validation for productId
        if (!isValid(productId))
            return res.status(400).send({ status: false, message: "Please provide productId" });
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: `The given productId: ${productId} is not in proper format` });

        // finding the user
        const findUser = await userModel.findOne({ _id: userId, isDeleted: true });
        if (!findUser)
            return res.status(404).send({ status: false, message: `User details not found with this provided userId: ${userId}` });

        //authorizatiion
        // if (req.decodedToken != userId)
        //     return res.status(403).send({ status: false, message: "Error, authorization failed" });

        // finding the product
        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!findProduct)
            return res.status(400).send({ status: false, message: "Product details are not found please select the product items" });

        // finding the cart with userID
        const findCart = await cartmodel.findOne({ userId: userId });

        // if cart is not present
        if (!findCart) {
            // if (cartId)
            //     return res.status(404).send({ status: false, message: `Cart not exists for this userId: ${userId}` });

            // creating the new Cart
            let cartData = {
                userId: userId,
                items: [{
                    productId: productId,
                    quantity: 1
                }],
                totalPrice: findProduct.price,
                totalItems: 1
            };

            //  creating the cart and populate the product details
            let finalCart = await cartmodel.create(cartData)//.populate({ path: 'items.productId', select: { '_id': 1, 'title': 1, 'price': 1, 'productImage': 1, 'description': 1 } });
            // const finalCart = await cartmodel .findOne(cartData).populate({ path: 'items.productId', select: { '_id': 1, 'title': 1, 'price': 1, 'productImage': 1, 'description': 1 } })

            return res.status(201).send({ status: true, message: "Success", data: finalCart });
        }

        // cart is already present
        if (findCart) {
            if (!isValid(cartId))
                return res.status(400).send({ status: false, message: "Please provide cartId" });
            if (!isValidObjectId(cartId))
                return res.status(400).send({ status: false, message: `The given cartId: ${cartId} is not in proper format` });
            if (findCart._id.toString() != cartId)
                return res.status(400).send({ status: false, message: `cartId provided does not belongs to this user with userId: ${userId}` });

            // updating the same prduct quantity
            const array = findCart.items;
            for (let i = 0; i < array.length; i++) {
                if (array[i].productId == productId) {
                    array[i].quantity++;
                    const updatedCart = await cartmodel.findOneAndUpdate(
                        { userId: userId },
                        { items: array, totalPrice: findCart.totalPrice + findProduct.price },
                        { new: true })//.populate({ path: 'items.productId', select: { _id: 1, title: 1, price: 1, productImage: 1, description: 1 } });

                    return res.status(201).send({ status: true, message: "Success", data: updatedCart });

                }
            }


            // adding the new product to the cart
            let obj = {}
            obj.productId = findProduct._id,
                obj.quantity = 1,
                findCart.items.push(obj);

            // updating the total price and total items 
            findCart.totalPrice = findCart.totalPrice + findProduct.price;
            findCart.totalItems = findCart.items.length;
            findCart.save();
            return res.status(201).send({ status: true, message: 'Success', data: findCart });

        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId

        // validation for userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `${userId} is invalid` })

        // seaarching the user Id
        const chekUser = await userModel.findOne({ _id: userId, isDeleted: false })
        if (!chekUser)
            return res.status(404).send({ status: false, message: "User  not exist" })

        //Authorization 
        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" })

        const data = req.body;
        let { cartId, productId, removeProduct } = data;

        // checking body for empty or not 
        if (!isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Request body cannot be empty" })

        // validation for productId
        if (!isValid(productId))
            return res.status(400).send({ status: false, message: "Please provide productId" })
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: `The given productId: ${productId} is not in proper format` })

        const checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!checkProduct)
            return res.status(400).send({ status: false, message: `Product details are not found with this productId: ${productId}, it must be deleted or not exists` });

        // validation for cartId
        if (!isValid(cartId))
            return res.status(400).send({ status: false, message: "Please provide cartId" })
        if (!isValidObjectId(cartId))
            return res.status(400).send({ status: false, message: `The given cartId: ${cartId} is not in proper format` })

        //checking cart details available or not 
        const checkCart = await cartmodel.findOne({ _id: cartId })
        if (!checkCart)
            return res.status(400).send({ status: false, message: `Cart does not exists with this provided cartId: ${cartId}` })

        //check for the empty items i.e., cart is now empty
        if (checkCart.items.length == 0)
            return res.status(400).send({ status: false, message: "You have not added any products in your cart" });

        // validatiion for removeProduct
        if (!isValid(removeProduct))
            return res.status(400).send({ status: false, message: "removeProduct is required" })
        // if (!isValidremoveProduct(removeProduct))
        //     return res.status(400).send({ status: false, message: "Enter valid removeproduct it can be only be '0' & '1'" })

        let cart = checkCart.items;
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                const priceChange = cart[i].quantity * checkProduct.price

                // directly remove a product from the cart ireespective of its quantity
                if (removeProduct == 0) {
                    const productRemove = await cartmodel.findOneAndUpdate({ _id: cartId }, {
                        $pull: { items: { productId: productId } },
                        totalPrice: checkCart.totalPrice, totalItems: checkCart.totalItems
                    }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: productRemove })
                }

                // remove the product when its quantity is 1
                if (removeProduct == 1) {
                    if (cart[i].quantity == 1 && removeProduct == 1) {
                        const priceUpdate = await cartmodel.findOneAndUpdate({ _id: cartId }, {
                            $pull: { items: { productId } },
                            totalPrice: checkCart.totalPrice - priceChange, totalItems: checkCart.totalItems - 1
                        }, { new: true })
                        return res.status(200).send({ status: true, message: 'Success', data: priceUpdate })
                    }

                    // decrease the products quantity by 1
                    cart[i].quantity = cart[i].quantity - 1
                    const updatedCart = await cartmodel.findByIdAndUpdate({ _id: cartId }, {
                        items: cart, totalPrice: checkCart.totalPrice - checkProduct.price
                    }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: updatedCart })
                }
            }
        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}




let getCart = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: 400, msg: "invalid objectid" })
        let cart = await cartmodel.findOne({ userId: userId }).populate({ path: "items.productId" })
        if (!cart) return res.status(400).send({ msg: "cart doesnot exist" })
        return res.status(200).send({ status: true,message:"Success", data: cart })
    }
    catch (err) {
        return res.status(500).send({ msg: err.message })
    }
}

//===================================================[API:FOR DELETING THE CART DETAILS]===========================================================


const deleteCart = async function (req, res) {
    try {

        // Validate params
        userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` })
        }

        //  To check user is present or not
        const userSearch = await userModel.findById({ _id: userId })
        if (!userSearch) {
            return res.status(404).send({ status: false, message: `User details are not found with this userId ${userId}` })
        }

        // AUTHORISATION
        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" })

        // To check cart is present or not
        const cartSearch = await cartmodel.findOne({ userId })
        if (!cartSearch) {
            return res.status(404).send({ status: false, message: "Cart details are not found " })
        }

        const cartDelete = await cartmodel.findOneAndUpdate({ userId }, { $set: { items: [], totalItems: 0, totalPrice: 0 } }, { new: true })
        return res.status(204).send({ status: true, message: "Cart is deleted successfully", data: cartDelete })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}
module.exports = { createCart, updateCart, deleteCart, getCart } 
