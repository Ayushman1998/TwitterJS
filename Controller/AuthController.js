const express = require('express');
const bcrypt = require('bcrypt');

const { cleanUpAndValidate } = require('../Utils/AuthUtils');
const UserModel = require('../Models/UserModel');

const auth = express.Router();

auth.get('/', (req, res) => {
    console.log('Recieved a request');
});

auth.post('/register', async (req, res) => {

    const { uname, username, password, phone, email, profilePic } = req.body;

    // Validating data
    try {
        await cleanUpAndValidate({ uname, username, password, phone, email });
    } catch (error) {
        return res.send({
            status: 400, // for failed
            message: error
        });
    }

    // checking if already user exists
    try {
        await UserModel.verifyUsernameAndEmailExists({ username, email });
    } catch (error) {
        return res.send({
            status: 400, // for failed
            message: "Error Occured",
            error
        });
    }

    try {
        const user = new UserModel({
            name: uname,
            username,
            password,
            email,
            phoneNumber: phone,
            profilePic
        });

        try {
            const dbUser = await user.registerUser();

            // Newsletter, Welcome email

            return res.send({
                status: 200,
                message: "Registration Successful",
                data: {
                    name: dbUser.name,
                    userId: dbUser._id,
                    email: dbUser.email,
                    username: dbUser.username
                }
            })
        } catch (error) {
            return res.send({
                status: 400, // for failed
                message: "Internal Error",
                error: error
            });
        }
    } catch (error) {
        return res.send({
            status: 400,
            message: "Invalid Data",
            error
        })
    }

});

auth.post('/login', async (req, res) => {

    const { loginId, password } = req.body;

    if (typeof (loginId) !== 'string' || typeof (password) !== 'string' || !loginId || !password) {
        return res.send({
            status: 400,
            message: "Invalid Credentials"
        });
    }

    try {

        const dbUser = await UserModel.findUserWithLoginId(loginId);
        
        const isMatch = await bcrypt.compare(password, dbUser.password);

        if (!isMatch) {
            return res.send({
                status: 400,
                message: "Invalid Password",
            });
        }
        
        req.session.isAuth = true;
        req.session.user = { 
            username: dbUser.username, 
            email: dbUser.email, 
            userId: dbUser._id 
        }
    
        return res.send({
            status: 200,
            message: "Logged in successfully",
            data: {
                name: dbUser.name,
                userId: dbUser._id,
                email: dbUser.email,
                username: dbUser.username
            }
        });

    } catch (error) {
        return res.send({
            status: 400,
            message: "Error Occured",
            error
        });
    }

});

auth.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if(err) throw err;

        return res.send('Logged out successfully');
    })
})

auth.get('/register', (req, res) => {
    // console.log('Register');
});

auth.get('/login', (req, res) => {
    // console.log('Login');
});

module.exports = auth;