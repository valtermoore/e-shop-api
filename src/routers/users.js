const express = require('express');
const router = new express.Router(); //to registry our routers

const User = require('../models/user');

const auth = require('../middleware/auth');
const { Error } = require('mongoose');

//Create user
router.post('/signup', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();

        const token = await user.generateAuthToken()

        res.status(200).send({ user, token });
    } catch (e) {
        res.send(e)
    }
});

//login
router.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const user = await User.findByCredentials(email, password);

        //calls the generateAuthToken function
        const token = await user.generateAuthToken();

        res.send({ user, token })

    } catch (e) {
        res.sendStatus(400);
    }
});

//Logout
router.post('/logout', auth, async (req, res) => {

    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        });
        await req.user.save();

        res.sendStatus(200)

    } catch (e) {
        res.sendStatus(500)
    }
});

//Read user //Read profile
router.get('/my-account', auth, async (req, res) => {
    const user = req.user;
    res.send(user);
});

//READ/GET ALL USERS
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({});
        const usersCount = await User.countDocuments((count) => count);

        if (!users) {
            throw new Error('No users found');
        }

        res.send({ users, usersCount });

    } catch (e) {
        res.send(e.msg);
    }
});

//DELETE USER
router.delete('/users/:id', auth, async (req, res) => {
    try {
        //Checks if the user is admin
        if (!req.user.isAdmin) {
            throw new Error('You are not authorized!')
        }

        //finds the user by id
        const user = await User.findById(req.params.id);

        if (!user) {
            throw new Error('User does not exist!')
        }

        //removes the user from db
        await user.remove();

        res.send('User deleted')

    } catch (e) {
        res.status(404).send(e.message)
    }
});


module.exports = router;