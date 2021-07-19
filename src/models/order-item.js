const mongoose = require('mongoose');


const orderItemSchema = new mongoose.Schema({
    quantity: {
        type: Number,
        require: true
    },
    product:{
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: 'Products'
    }
});

const OrderItem = mongoose.model('OrderItem', orderItemSchema);

module.exports = OrderItem;