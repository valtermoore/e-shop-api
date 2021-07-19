const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    icon: {
        type: String
    },
    color:{
        type: String
    },
    image:{
        type: String,
        // required: true
    }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;