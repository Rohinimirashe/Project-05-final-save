const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        refs: 'User',
        unique: true,
        required: true
    },
    items: [{
        _id: false,

        productId: {
            type: ObjectId,
            refs: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1

        }
    }],
    totalPrice: {
        type: Number,
        required: true
        // Holds total price of all the items in the cart
    },
    totalItems: {
        type: Number,
        required: true,
        // Holds total number of items in the cart
    },
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema) 