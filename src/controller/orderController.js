const CartModel = require("../model/cartModel")
const UserModel = require("../model/userModel")
const OrderModel = require("../model/orderModel")
const {isValidObjectId, isValidRequestBody, isValid,}=require("../validators/validation")



const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId;

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });

        const findUser = await UserModel.findOne({ _id: userId });
        if (!findUser)
            return res.status(404).send({ status: false, message: `User details not found with this provided userId: ${userId}` });

        const data = req.body;
        const { cartId } = data;

        if (!isValidRequestBody(data))
            return res.status(400).send({ status: true, message: "Request body cannot remain empty" });

        if (!isValid(cartId))
            return res.status(400).send({ status: false, message: "CartId is required" });
        if (!isValidObjectId(cartId))
            return res.status(400).send({ status: false, message: `The given cartId: ${cartId} is not in proper format` });

       
        const findCart = await CartModel.findOne({ _id: cartId, userId: userId });
        if (!findCart)
            return res.status(404).send({ status: false, message: `Cart details are not found with the cartId: ${cartId}` });

        if (findCart) {
            let array = findCart.items
            var count = 0;
            for (let i = 0; i < array.length; i++) {
                if (array[i].quantity) {
                    count += findCart.items[i].quantity;
                }
            }
        }

        if (findCart.items.length == 0)
            return res.status(400).send({ status: false, message: "You have not added any products in your cart" });

        let response = {
            userId: findCart.userId,
            items: findCart.items,
            totalPrice: findCart.totalPrice,
            totalItems: findCart.totalItems,
            totalQuantity: count
        };

        const orderCreated = await OrderModel.create(response)

        return res.status(201).send({ status: true, message: 'Success', data: orderCreated });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


const updateOrder = async function (req, res) {
    try {
        const userId = req.params.userId;
        const data = req.body;
        const { orderId, status } = data;

        if (!isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Please provide data in the request body" })

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });

        if (!isValid(orderId))
            return res.status(400).send({ status: false, message: "OrderId is Required" });
        if (!isValidObjectId(orderId))
            return res.status(400).send({ status: false, message: "The given orderId is not in proper format" });

        const findUser = await UserModel.findOne({ _id: userId });
        if (!findUser)
            return res.status(404).send({ status: false, message: `User details not found with this provided userId: ${userId}` });

            // authorization
        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" });

        const findOrder = await OrderModel.findOne({ _id: orderId, userId: userId })
        if (!findOrder)
            return res.status(404).send({ status: false, message: `Order details is not found with the given OrderId: ${userId}` })


        if (findOrder.cancellable == true) {
            if (!isValid(status))
                return res.status(400).send({ status: false, message: "Status is required and the fields will be 'pending', 'completed', 'cancelled' only  " });

            let statusIndex = ["pending", "completed", "cancelled"];
            if (statusIndex.indexOf(status) == -1)
                return res.status(400).send({ status: false, message: "Please provide status from these options only ('pending', 'completed' or 'cancelled')" });


            if (status == 'completed') {
                if (findOrder.status == 'pending') {
                    const updateStatus = await OrderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status, isDeleted: true, deletedAt: Date.now() } }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: updateStatus });
                }
                if (findOrder.status == 'completed') {
                    return res.status(400).send({ status: false, message: "Your order is already completed" });
                }
                if (findOrder.status == 'cancelled') {
                    return res.status(400).send({ status: false, message: "Your order is cancelled, so you cannot change the status " });
                }
            }

            if (status == 'cancelled') {
                if (findOrder.status == 'pending') {
                    const updateStatus = await OrderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status, isDeleted: true, deletedAt: Date.now() } }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: updateStatus });
                }
                if (findOrder.status == 'completed') {
                    return res.status(400).send({ status: false, message: "Your order is already completed" });
                }
                if (findOrder.status == 'cancelled') {
                    return res.status(400).send({ status: false, message: "Your order is already cancelled, because it is already cancelled" });
                }
            }
        }

        if (findOrder.cancellable == false) {

            if (!isValid(status))
                return res.status(400).send({ status: false, message: "Status is required and the fields will be 'pending', 'completed', 'cancelled' only" });

            if (status == 'completed') {
                if (findOrder.status == 'pending') {
                    const updateStatus = await OrderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status, isDeleted: true, deletedAt: Date.now() } }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: updateStatus });
                }
                if (findOrder.status == 'completed') {
                    return res.status(400).send({ status: false, message: "The status is already completed" });
                }
                if (findOrder.status == 'cancelled') {
                    return res.status(400).send({ status: false, message: "The status is cancelled, you cannot change the status" });
                }
            }

            if (status == 'cancelled') {
                return res.status(400).send({ status: false, message: "Cannot be cancelled as it is not cancellable" })
            }
        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createOrder, updateOrder }