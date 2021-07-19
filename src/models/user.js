const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true //to remove empty spaces
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,

        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7, //to contain at least 7 characters,

        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error(`Password cannot contain the word 'password'`)
            }
        }
    },
    street: {
        type: String,
        require: true
    },
    city: {
        type: String,
    },
    phone: {
        type: Number,
        require: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    tokens: [{
        token: {
            type: String,
            require: true
        }
    }],

}, {
    timestamps: true //to automatically create timestamps
});

//FIELDS TO HIDE ON RESPONSE
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();//converts the user model into JS object

    delete userObject.password; //hide the password
    delete userObject.tokens; //hide the tokens

    return userObject;
}

//bcrypt to encrypt the password when is created/modified before/pre running the route handler/enpoint and before saving to database
userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    //to pass it to the route handler
    next();
});

//to validate/authenticate the user email and password
userSchema.statics.findByCredentials = async (email, password) => {
    //will find the user email
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error('Email or password Incorrect !')
    }

    //will find/compare the user password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        throw new Error('Email or password incorrect !')
    }

    //returns the user if email and password are correct
    return user;
}

//
userSchema.methods.generateAuthToken = async function () {
    const user = this;

    //signs the token to a given user id and the admin status
    //para se o user nao tiver os dados do token nao ter autorizacao de entrar
    const token = jsonwebtoken.sign({ _id: user._id.toString(), isAdmin: user.isAdmin }, process.env.JWT_SECRET_KEY);
    //adds the token in the tokens array
    user.tokens = user.tokens.concat({ token });

    await user.save();

    return token
}


const User = mongoose.model('User', userSchema);

module.exports = User;