const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Types.ObjectId,
        require: true,
        ref: 'User'
    },
    orderItems: [{
        type: mongoose.Types.ObjectId,
        require: true,
        ref: 'OrderItem'
    }],
    street: {
        type: String,
        require: true
    },
    city: {
        type: String,
        require: true
    },
    phone: {
        type: Number,
        require: true
    },
    status: {
        type: String,
        require: true,
        default: 'Pending'
    },
    totalPrice: {
        type: Number,
        require: true
    },
    paymentType: {
        type: Number,
        require: true
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;