// package imports
const express = require('express');
const session = require('express-session');
const mongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const path = require('path');

// file imports(if any)
const privateConstants = require('./private-constants');

// routes imports
const AuthController = require('./Controller/AuthController');
const TweetController = require('./Controller/TweetController');
const FollowController = require('./Controller/FollowController');

const app = express();

// connect to database
mongoose.connect(privateConstants.MONGODBURI)
    .then(res => {
        console.log('Connected to database successfully');
    }).catch(err => {
        console.log(err);
    });

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// view engine setup
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// session based authentication
const store = new mongoDBSession({
    uri: privateConstants.MONGODBURI,
    collection: 'tb_sessions'
});

app.use(session({
    secret: privateConstants.SESSIONKEY,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
    store: store
}));

app.get('/', (req, res) => {
    res.send("Welcome to home page");
});

// router
app.use('/auth', AuthController);
app.use('/tweet', TweetController);
app.use('/follow', FollowController);

app.get('/*', (req, res) => {
    res.send({
        status: 404,
        message: "Page not found"
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Listening on PORT 3000');
});