const express = require('express');
const router = new express.Router();

const Category = require('../models/category');

const uploads = require('../middleware/multer');
const uploadFile = require('../aws-s3/s3');


//CREATE CATEGORY
router.post('/category', uploads.single('image'), async (req, res) => {

    // const fileName = req.file.filename; //the file from client side

    // const basePath = `${req.protocol}://${req.get('host')}/uploads/`;

    const bucketRes = await uploadFile(req.file);

    const category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
        image: bucketRes.Location // http://localhost:3000/uploads/image-1234
    });

    if (!category) {
        throw new Error()
    }

    try {
        await category.save();
        res.send(category)
    } catch (e) {
        res.send(e)
    }

});

//READ/GET CATEGORIES
router.get('/category', async (req, res) => {
    const category = await Category.find({});

    res.send(category)
});

//READ/GET CATEGORY BY ID  
router.get('/category/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            throw new Error()
        }

        res.send(category);
    } catch (e) {
        res.status(404).json({ message: 'Category not found' })
    }
});


//UPDATE CATEGORY
router.put('/category/:id', uploads.single('image'), async (req, res) => {

    try {
        // const category = await Category.findById(req.params.id);
        // const body = req.body;

        // //validate
        // const updates = Object.keys(body);
        // const allowedFields = ['name', 'icon', 'color'];
        // const isValid = updates.every((update) => allowedFields.includes(update));

        // if (!isValid) {
        //     throw new Error()
        // }

        // updates.map((update) => {
        //     category[update] = body[update]
        // });
        const fileName = req.file.filename; //the file from client side

        const basePath = `${req.protocol}://${req.get('host')}/uploads/`;

        const category = await Category.findByIdAndUpdate(req.params.id,
            {
                name: req.body.name,
                icon: req.body.icon,
                color: req.body.color,
                image: `${basePath}${fileName}`

            }, { new: true }
        )

        if (!category) {
            throw new Error()
        }

        await category.save();
        res.send(category)

    } catch (e) {
        res.status(400).json({ Error: 'Invalid updates' })
    }
});

//DELETE CATEGORY
router.delete('/category/:id', async (req, res) => {

    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            throw new Error()
        }

        await category.delete();
        res.json({ message: 'Category was deleted' })
    } catch (e) {
        res.status(404).send(e)
    }
});



module.exports = router;
