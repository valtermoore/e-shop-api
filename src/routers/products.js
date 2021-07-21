const express = require('express');
const router = new express.Router();//to regist the router

const Product = require('../models/product');
const Category = require('../models/category');
const mongoose = require('mongoose');

const uploads = require('../middleware/multer');//multer middleware for file uploads
const sharp = require('sharp');
const auth = require('../middleware/auth');//auth middleware for authentication

//to upload the image to s3 bucket
const { uploadFile, getFileAws } = require('../aws-s3/s3');

//CREATE PRODUCT
router.post('/products', uploads.single('image'), async (req, res) => {

    try {
        // //checks if the user is admin
        // if (!req.user.isAdmin) {
        //     throw new Error('You are not authorized!')
        // }

        const category = await Category.findById(req.body.category);

        if (!category) {
            return res.status(400).send('Invalid category!');
        }

        if (!req.file) {
            return res.send('You must upload an image')
        }

        const bucketRes = await uploadFile(req.file)
        console.log(bucketRes)
        const fileName = req.file.filename; //await sharp(req.file.buffer).jpeg().toBuffer(); 
        //console.log(fileName)
        const basePath = `${req.protocol}://${req.get('host')}/uploads/`;
        //console.log(basePath)
        const product = new Product({
            ...req.body,
            name: req.body.name,
            brand: req.body.brand,
            price: req.body.price,
            category: category._id,
            description: req.body.description,
            countInStock: req.body.countInStock,
            isFeatured: req.body.isFeatured,
            image: `${bucketRes.Location}`, // http://localhost:3000/public/upload/image-1234
        });
        // console.log(req.file)
        await product.save();
        res.status(200).send({ message: 'Product created' });
    } catch (e) {
        res.send(e.message);
    }
});

//READ ALL PRODUCTS
router.get('/products', async (req, res) => {

    try {

        // const category = await Category.findById(req.query.categories) //tambem serve mas nao da para multiplas categorias, so uma de cada vez
        let filter = {}

        if (req.query) {
            filter = {
                category: req.query.categories.split(','), //to allow filter various categories separated by ',' on the url query
                price: { $gte: 0, $lte: req.query.price }, //filters the prices from 0 to a certain number
                brand: req.query.brand
            }
        }
        // // //if there's no brand it will accept the price and category
        if (!req.query.brand) {
            filter = {
                category: req.query.categories.split(','), //to allow filter various categories separated by ',' on the url query
                price: { $gte: 0, $lte: req.query.price }, //filters the prices from 0 to a certain number
                // brand: req.query.brand
            }
        }


        //gets all products or by categorie
        const product = await Product.find(filter).populate('category');

        if (!product) {
            throw new Error()
        }

        //counts the documents from the filtered category/categories
        const productCount = await Product.countDocuments(product, (count) => count);


        //res.set('Content-Type', 'image/png');
        res.send({ product, productCount });
    } catch (e) {
        res.status(500).send(e.message)
    }
});

//READ/GET A PRODUCT BY ID
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            throw new Error('Product not found');
        }

        // res.set('Content-Type', 'image/png');
        res.send(product);
    } catch (e) {
        res.status(404).send(e.message)
    }
});

// router.get('/products/:key', async (req, res) => {
//     const key = req.params.key;
//     console.log(key)

//     const readStream = getFileAws(key)
//     console.log(readStream)

//     //will convert the stream to a image file
//     readStream.pipe(res)
//     // res.send(readStream)
// })

router.get('/products/brands', async (req, res) => {
    try {
        const product = await Product.find({}).select('brand');

        if (!product) {
            throw new Error()
        }

        res.send(product)

    } catch (e) {
        res.status(500).send(e.message)
    }
})




//READ/GET FEATURED PRODUCTS
router.get('/products/featured/:limit', async (req, res) => {

    try {
        // checks if theres a limit requested in the query
        const limitNum = req.query.limit ? req.query.limit : 0

        //finds the product that isFeatured and passes the limit query with the converted limitNum
        const products = await Product.find({ isFeatured: true }, null, { limit: parseInt(limitNum) });

        if (!products) {
            return res.status(400).send('No products to feature')
        }

        res.send(products);

    } catch (e) {
        res.status(400).send(e)
    }
});

//INSERT MULTIPLE IMAGES
router.patch('/products/images/:id', auth, uploads.array('images', 3), async (req, res) => {
    try {
        //checks if the user is admin
        if (!req.user.isAdmin) {
            return res.send('You are not authorized!');
        }

        //check if the product id is valid
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid product id')
        }

        //checks if theres files
        const files = req.files;
        if (!files) {
            throw new Error('Please insert images.');
        }

        const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;

        const filesArr = []
        files.map((file) => {
            //console.log(file.filename)
            filesArr.push(`${basePath}${file.filename}`)
        });


        const product = await Product.findByIdAndUpdate(req.params.id, { images: filesArr }, { new: true });
        await product.save();
        res.send(product)
    } catch (e) {
        res.send(e.message)
    }


});

//UPDATE PRODUCT
router.patch('/products/:id', auth, async (req, res) => {
    //checks if the user is admin
    if (!req.user.isAdmin) {
        return res.send('You are not authorized!');
    }

    //check if the product id is valid
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid product id')
    }

    const product = await Product.findById(req.params.id);
    const category = await Category.findById(req.body.category);

    const body = req.body;

    //to validate the entered fields to be updated
    const updates = Object.keys(body);
    const allowedFields = ['name', 'price', 'countInStock', 'description', 'category', 'isFeatured', 'image', 'images', 'brand', 'richDescription', 'rating', 'numReviews'];
    const isValid = updates.every((update) => allowedFields.includes(update));

    //validates the fields
    if (!isValid) {
        return res.status(400).send('Error: Invalid Updates');
    }

    //validates the category
    if (!category) {
        return res.status(400).send('Error: Category is invalid!')
    }


    try {
        updates.map((update) => {
            product[update] = req.body[update] //will add every update fields to the product 
        });

        await product.save();
        res.send(product);
    } catch (e) {
        res.status(400).send(e.message)
    }
});

//DELETE PRODUCT
router.delete('/products/:id', async (req, res) => {

    try {
        const product = await Product.findById(req.params.id);
        await product.remove();

        res.send(product)
    } catch (e) {
        res.send(e)
    }
});



module.exports = router;
