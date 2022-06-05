const cartModel = require("../models/cartModel")
const orderModel = require("../models/orderModel")
const validator = require("../utils/validator")
const userModel = require("../models/userModel")
const productModel = require("../models/productModel")



const createOrder = async function (req, res) {
    try {
        let UserId = req.params.userId
        let data = req.body

        if (!validator.isValidObjectId(UserId)) {
            return res.status(400).send({ status: false, msg: 'invalid User ID' })
        }

        let userid = await userModel.findById({ _id: UserId })
        if (!userid) {
            return res.status(400).send({ status: false, msg: 'user does not exist' })
        }
        if (!validator.isValidDetails(data)) {
            return res.status(400).send({ status: false, msg: 'please enter order details' })
        }

        let { cartId, status, cancellable } = data

        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: 'cart Id is invalid' })
        }

        let isCartId = await cartModel.findById({ _id: cartId })
        if (!isCartId) {
            return res.status(400).send({ status: false, msg: 'cart ID does not exist' })
        }

        if (status)
            if (!validator.isValidStatus(status)) {
                return res.status(400).send({ status: false, msg: 'Please enter valid status' })
            }

        if (cancellable)
            if (typeof (cancellable) != "boolean") {
                return res.status(400).send({ status: false, msg: 'please enter valid value' })
            }

        let totalQuantityInCart = 0
        for (let i = 0; i < isCartId.items.length; i++) {
            totalQuantityInCart += isCartId.items[i].quantity

        }

        if (isCartId.totalItems.length == 0) {
            return res.status(202).send({ status: false, msg: "Order Already placed or cart is deleted" });
        }

        let newOrder = {
            userId: UserId,
            items: isCartId.items,
            totalPrice: isCartId.totalPrice,
            totalItems: isCartId.totalItems,
            totalQuantity: totalQuantityInCart
        }

        const create = await orderModel.create(newOrder)

        return res.status(201).send({ status: true, msg: 'order placed successfully', data: create })
    }

    catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }
}

module.exports.createOrder = createOrder

const updateOrder = async function (req, res) {
    try {
        const query = req.query

        const userIdFromParams = req.params.userId


        if (!validator.isValidObjectId(userIdFromParams)) {
            return res.status(400).send({ status: false, msg: 'userId is invalid' })
        }
        const findUser = await userModel.findById(userIdFromParams);

        if (!findUser) {
            return res.status(404).send({ status: false, msg: 'user not found' })

        }

        let data = req.body

        if (!validator.isValidDetails(data)) {
            return res.status(400).send({ status: false, msg: 'enter your detailsto update' })
        }

        const { orderId, status } = data


        if (!validator.isValidValue(orderId)) {
            return res.status(400).send({ status: false, msg: 'provide orderId' })

        }
        if (!validator.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, msg: ' productId is invalid' })
        }
        const findOrder = await orderModel.findById(orderId)
        if (!findOrder) {
            return res.status(400).send({ status: false, msg: 'orderId is wrong' })
        }

        if (!validator.isValidStatus(status)) {
            return res.status(400).send({ status: false, msg: 'provide valid status like [pending,completed,cenclle]' })
        }

        if (status === 'pending') {
            if (findOrder.status === 'completed') {
                return res.status(400).send({ status: false, msg: 'order can not be update to pending.because it is completed' })
            }
            if (findOrder.status === 'cancelled') {
                return res.status(400).send({ status: false, msg: 'order can not be update to pending. because it is cancelled' })
            }
            if (findOrder.status === 'pending') {
                return res.status(400).send({ status: false, msg: 'order is already pending' })
            }
        }

        if (status === 'completed') {
            if (findOrder.status === 'cancelled') {
                return res.status(400).send({ status: false, message: "Order can not be updated to completed. because it is cancelled." })
            }
            if (findOrder.status === 'completed') {
                return res.status(400).send({ status: false, message: "Order is already completed." })
            }
            const orderStatus = await orderModel.findOneAndUpdate({ _id: orderId },
                { $set: { items: [], totalPrice: 0, totalItems: 0, totalQuantity: 0, status } }, { new: true });
            return res.status(200).send({ status: true, message: "order completed successfully", data: orderStatus })
        }

        if (status === 'cancelled') {

            if (status === 'cancelled') {
                if (findOrder.cancellable == false) {
                    return res.status(400).send({ status: false, message: "Item can not be cancelled, because it is not cancellable." })
                }

                if (findOrder.status === 'cancelled') {
                    return res.status(400).send({ status: false, message: "Order is already cancelled." })
                }
                const findOrderAfterDeletion = await orderModel.findOneAndUpdate({ _id: orderId },
                    { $set: { items: [], totalPrice: 0, totalItems: 0, totalQuantity: 0, status: 'cancelled' } }, { new: true })
                return res.status(200).send({ status: true, message: "Order is cancelled successfully", data: findOrderAfterDeletion })
            }
        }
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ message: err.message })
    }
}


module.exports.updateOrder = updateOrder






