const jsonwebtoken = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {

    try {
        // gets the value from the header then replace the bearer with empty space
        const token = req.header('Authorization').replace('Bearer ', '');

        //verify the token in the header
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET_KEY);

        //will find the user with id === token id and with the token === token
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        //adds the current token
        req.token = token;

        //adds the authenticated user 
        req.user = user;

        //to allow associated route handler to run
        next();
    } catch (e) {
        res.status(401).send('Please authenticate')
    }
}

module.exports = auth;