const express = require('express');

const { checkAuth } = require('../middleware');
const TweetModel = require('../Models/TweetModel');
const UserModel = require('../Models/UserModel');
const { getFollowingList } = require('../Models/FollowModel');
const constants = require('../constants');
const { validateMongoDbIds } = require('../Utils/CommonUtil');

const tweet = express.Router();

tweet.post('/create', checkAuth, async (req, res) => {
    const { title, text } = req.body;
    const userId = req.session.user.userId;
    const creationDateTime = new Date();

    // check for valid parameters
    if(!title || !text || typeof(title) !== "string" || typeof(text) !== "string"){
        return res.send({
            status: 401,
            message: "Innalid request parameters",
            error: "Missing title or body text"
        });
    }

    if(title.length > 200) {
        return res.send({
            status: 401,
            message: "Title too long. Max character allowed is 200"
        });
    }

    if(text.length > 1000) {
        return res.send({
            status: 401,
            message: "Body text too long. Max character allowed is 1000"
        });
    }

    let tweetCount
    try {
        tweetCount = await TweetModel.countTweetOfUser(userId);
    } catch (error) {
        return res.send({
            status: 401,
            message: "Database Error",
            error
        });
    }

    if(tweetCount >= 1000) {
        return res.send({
            status:400,
            message: "You have already created 1000 tweets. Please try after deleting older tweet"
        });
    }

    const tweet = new TweetModel({
        userId,
        title,
        text,
        creationDateTime
    });

    try {
        const dbTweet = await tweet.createTweet();

        return res.send({
            status: 200,
            message: "Tweet created successfully",
            data: {
                tweetId: dbTweet._id,
                title: dbTweet.title,
                text: dbTweet.text,
                creationDateTime: dbTweet.creationDateTime,
                userId: dbTweet.userId
            }
        });
    } catch (error) {
        return res.send({
            status: 401,
            message: "Database error",
            error
        });
    }
});

tweet.post('/update', checkAuth, async (req, res) => {
    const { title, text, tweetId } = req.body;
    const userId = req.session.user.userId;

    // check for valid parameters
    if(!title || !text){
        return res.send({
            status: 401,
            message: "Invalid request parameters",
            error: "Missing title or body text"
        });
    }

    if(title && title.length > 200) {
        return res.send({
            status: 401,
            message: "Title too long. Max character allowed is 200"
        });
    }

    if(text && text.length > 1000) {
        return res.send({
            status: 401,
            message: "Body text too long. Max character allowed is 1000"
        });
    }

    let tweetCount
    try {
        tweetCount = await TweetModel.countTweetOfUser(userId);
    } catch (error) {
        return res.send({
            status: 401,
            message: "Database Error",
            error
        });
    }

    if(tweetCount >= 1000) {
        return res.send({
            status:400,
            message: "You have already created 1000 tweets. Please try after deleting older tweet"
        });
    }

    // Authorized to update the tweet
    let dbTweet;
    try {
        dbTweet = await TweetModel.findTweetById(tweetId);
    } catch (error) {
        return res.send({
            status: 401,
            message: "Database error",
            error
        });
    }

    if(!dbTweet){
        return res.send({
            status: 401,
            message: "No tweet found"
        });
    }

    if(userId.toString() !== dbTweet.userId){
        return res.send({
            status: 403,
            message: "Unauthorized request. Tweet belongs to some other user."
        });
    }

    // update within 30 minutes

    const currentTime = Date.now();
    const creationDateTime = (new Date(dbTweet.creationDateTime)).getTime();

    const diff = (currentTime - creationDateTime)/(1000*60);

    if(diff > 30){
        return res.send({
            status: 400,
            message: "Update unsuccessful",
            error: "Cannot update tweets after 30 minutes of tweeting"
        });
    }

    // update the tweet in db
    try {
        const tweet = new TweetModel({
            tweetId,
            title,
            text
        });

        const dbtweet = await tweet.updateTweet();

        return res.send({
            status: 200,
            message: "Update successful",
            data: dbTweet
        });
    } catch (error) {
        return res.send({
            status: 401,
            message: "Database error",
            error
        });
    }
});

tweet.post('/delete', checkAuth, async (req, res) => {
    const { tweetId } = req.body;

    if(!tweetId) {
        return res.send({
            status: 400,
            message: "Invalid request"
        });
    }

    const userId = req.session.user.userId;
    
    let dbTweet;
    try {
        dbTweet = await TweetModel.findTweetById(tweetId);
    } catch (error) {
        return res.send({
            status: 401,
            message: "Database error",
            error
        });
    }

    if(!dbTweet) {
        return res.send({
            status: 400,
            message: "Invalid tweet ID"
        })
    }

    if(userId.toString() !== dbTweet.userId){
        return res.send({
            status: 403,
            message: "Unauthorised request"
        });
    }

    // Deleting the tweet

    const tweet = new TweetModel({tweetId});

    try {
        const dbtweeet = await tweet.deleteTweet();

        return res.send({
            status: 200,
            message: "Tweet daleted successfully",
            data: dbtweeet
        });
    } catch (error) {
        return res.send({
            status: 401,
            message: "Interal server error",
            error
        });
    }
});

tweet.get('/recent', async (req, res) => {

    const offset = req.query.offset || 0;

    try {
        const dbTweets = await TweetModel.getRecentTweets(offset);

        return res.send({
            status: 200,
            message: "Read successful",
            data: dbTweets
        });
    }
    catch(error) {
        return res.send({
            status: 400,
            message: "Internal server error. Please try again",
            error
        });
    }
});

tweet.get('/get-following-tweets',checkAuth, async (req, res) => {
    const offset = req.query.offset || 0;
    const userId = req.session.user.userId;

    try {
        const followingUserIds = await getFollowingList({followerUserId: userId.toString(), offset, limit: constants.FOLLOWLIMIT});
        const dbTweets = await TweetModel.getTweets({offset, userIds: followingUserIds});

        return res.send({
            status: 200,
            message: "Read Successful",
            data: dbTweets
        });
    } catch (error) {
        return res.send({
            status: 400,
            message: "Internal error. Please try again",
            error
        });
    }
});

tweet.get('/get-tweets/:userId', async (req, res) => {
    const offset = req.query.offset || 0;
    const userId = req.params.userId;

    if(!userId || !validateMongoDbIds([userId])) {
        return res.send({
            status: 401,
            message: "Missing Parameter. Following user id should be valid."
        });
    }

    try {
        await UserModel.verifyUserIdExists(userId);
    } catch (error) {
        return res.send({
            status: 400,
            message: "Internal server error",
            error
        });
    }

    try {
        const dbTweets = await TweetModel.getTweets({offset, userIds: [userId]});

        return res.send({
            status: 200,
            message: "Read Successful",
            data: dbTweets
        });
    } catch(error) {
        return res.send({
            status: 400,
            message: "Internal error. Please try again",
            error
        });
    }
});

tweet.get('/*', (req, res) => {
    res.send({
        status: 404,
        message: "Page not found"
    });
});

module.exports = tweet;