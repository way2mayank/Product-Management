const cartmodel =require ("../model/cartModel")
const productModel=require("../model/productModel")
const userModel = require("../model/userModel")

const { isValid, isValidRequestBody, isValidObjectId,nameFormet }=require("../validators/validation")

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
        const findUser = await userModel.findOne({ _id: userId });
        if (!findUser)
            return res.status(404).send({ status: false, message: `User details not found with this provided userId: ${userId}` });

        //authorizatiion
        // if (req.decodedToken != userId)
        //     return res.status(403).send({ status: false, message: "Error, authorization failed" });

        // finding the product
        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!findProduct)
            return res.status(404).send({ status: false, message: "Product details are not found please select the product items" });

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
          let finalCart =  await cartmodel.create(cartData)//.populate({ path: 'items.productId', select: { '_id': 1, 'title': 1, 'price': 1, 'productImage': 1, 'description': 1 } });
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

                    return res.status(200).send({ status: true, message: "Success", data: updatedCart });

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
            return res.status(200).send({ status: true, message: 'Success', data: findCart });

        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

// PUT /users/:userId/cart (Remove product / Reduce a product's quantity from the cart)
// Updates a cart by either decrementing the quantity of a product by 1 or deleting a product from the cart.
// Get cart id in request body.
// Get productId in request body.
// Get key 'removeProduct' in request body.
// Make sure that cart exist.
// Key 'removeProduct' denotes whether a product is to be removed({removeProduct: 0}) or its quantity has to be decremented by 1({removeProduct: 1}).
// Make sure the userId in params and in JWT token match.
// Make sure the user exist
// Get product(s) details in response body.
// Check if the productId exists and is not deleted before updating the cart.
// Response format
// On success - Return HTTP status 200. Also return the updated cart document. The response should be a JSON object like this
// On error - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like this


module.exports = { createCart }
