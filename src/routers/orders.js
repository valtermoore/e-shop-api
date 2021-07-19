const express = require('express');
const router = new express.Router();

const Order = require('../models/order');
const OrderItem = require('../models/order-item');
const Product = require('../models/product');

const auth = require('../middleware/auth');
const { Error } = require('mongoose');

//CREATE ORDER
router.post('/orders',auth, async (req, res) => {

    try {
        const user = req.user;
        //para utilizar async/await dentro de um array deve-se utilizar o Promise.all para esperar/wait ate' all is resolved
        const orderItemId = await Promise.all(req.body.orderItems.map(async (orderItem) => {

            //finds the product and check if is in stock or not
            const product = await Product.findById(orderItem.product);
            if (orderItem.quantity > product.countInStock) {
                throw new Error('The product is out of stock')
            }
            //will discount in the product stock
            product.countInStock = product.countInStock - orderItem.quantity;

            //creates new order item with quantity and product id
            const newOrderItem = new OrderItem({
                quantity: orderItem.quantity,
                product: orderItem.product
            });

            //saves the order item in the db
            await newOrderItem.save();
            //saves the product after discount the stock in the db
            await product.save();

            //returns the id of the order item
            return newOrderItem._id;
        }));

        //Creates a Promise that is resolved with an array of results when all of the provided Promises resolve, or rejected when any Promise is rejected.
        //will wait and resolve this Promise.all untill everything in the array is resolved -- e' usado em arrays que fazem o uso de async/await 
        const totalPricePerItem = await Promise.all(orderItemId.map(async (orderItemId) => {
            //populate to have access to the product and product price properties
            const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
            const totalPrice = orderItem.product.price * orderItem.quantity;

            return totalPrice;
        }));

        //Will sum all the elements in the array
        const totalPrice = totalPricePerItem.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

        //creates the order
        const order = new Order({
            ...req.body,
            owner: user._id,
            orderItems: orderItemId, //adds the id of the order/s item/s in the orderItems array
            street: req.body.street,
            city: req.body.city,
            phone: req.body.phone,
            totalPrice: totalPrice,
            paymentType: req.body.paymentType
        });

        //saves the order in the db
        await order.save();
        res.send({ message: 'Order confirmed!', status: true, order: order._id });
    } catch (e) {
        res.status(400).send(e.message)
    }
});

//READ/GET ORDERS
router.get('/orders', async (req, res) => {

    try {
        const orders = await Order.find()
            .populate('owner')
            .populate({
                path: 'orderItems',
                populate: {
                    path: 'product', populate: 'category'
                }
            });//to populate properties inside an array
        //No ordeItems popular product e popular category

        if (!orders) {
            throw new Error('No orders');
        }

        res.send(orders)
    } catch (e) {
        res.send(e.message);
    }
});

//READ/GET SPECIFIC ORDER
router.get('/orders/:id', async (req, res) => {

    try {
        const order = await Order.findById(req.params.id)
            .populate('owner')
            .populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } });//to populate properties inside an array


        if (!order) {
            throw new Error()
        }

        res.send(order)

    } catch (e) {
        res.status(404).send(e)
    }
});

//READ/GET ORDERS FROM A AUTHENTICATED USER
router.get('/my-account/orders', auth, async (req, res) => {
    try {
        const userOrderList = await Order.find({ owner: req.user._id })
            .populate('owner', 'name')
            .populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } });

        if (!userOrderList) {
            throw new Error('Orders not found')
        }

        res.send(userOrderList);
    } catch (e) {
        res.send(e.message);
    }
});

//READ/GET ORDERS STATS
router.get('/orders/get/stats', async (req, res) => {
    try {
        const totalSales = await Order.aggregate([
            {
                $group: { _id: null, totalsales: { $sum: "$totalPrice" } }
            }
        ]);

        const ordersCount = await Order.find({}).countDocuments((count) => count);

        if (!totalSales) {
            return res.send('Error')
        }

        res.send({ totalSales, ordersCount });
    } catch (e) {
        res.send(e);
    }
});


//UPDATE ORDER STATUS
router.patch('/orders/:id', async (req, res) => {

    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });

        if (!order) {
            throw new Error()
        }

        await order.save();
        res.send(order);
    } catch (e) {
        res.status(400).send(e)
    }
});

//DELETE ORDER
router.delete('/orders/:id', async (req, res) => {
    const _id = req.params.id;

    try {
        //will find the order and map the orderItems and delete them also
        const order = await Order.findByIdAndDelete(_id);
        order.orderItems.map(async (orderItem) => {
            await OrderItem.findByIdAndDelete(orderItem._id);

            return res.status(200);
        });

        if (!order) {
            res.status(404).send()
        }

        res.status(200).json({ message: 'Order deleted' })
    } catch (e) {
        res.send(e)
    }
});


module.exports = router;