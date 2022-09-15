const express = require('express');

const FollowModel = require('../Models/FollowModel');
const UserModel = require('../Models/UserModel');
const { checkAuth } = require('../middleware');
const { validateMongoDbIds } = require('../Utils/CommonUtil');
const constants = require('../constants');

const follow = express.Router();

// A follows B
// A id is followerUserId
// B id is follwingUserId

follow.post('/follow-user', checkAuth, async (req, res) => {
    const followingUserId = req.body.followingUserId;

    if(!followingUserId || !validateMongoDbIds([followingUserId])) {
        return res.send({
            status: 401,
            message: "Missing Parameter. Following user id should be valid."
        });
    }

    const followerUserId = req.session.user.userId;

    if(followingUserId.toString() === followerUserId.toString()) {
        return res.send({
            status: 401,
            message: "Following and follower are same. You cannot follow yourself."
        });
    }

    try {
        await UserModel.verifyUserIdExists(followingUserId);
    } catch (error) {
        return res.send({
            status: 400,
            message: "Internal server error",
            error
        });
    }

    try {
        const dbFollow = await FollowModel.verifyfollowExists({followingUserId, followerUserId});

        if(dbFollow){
            return res.send({
                status: 401,
                message: "User already followed",
                data: dbFollow
            })
        }
    } catch (error) {
        return res.send({
            status: 400,
            message: "Database error",
            error
        });
    }

    try {
        const dbFollow = await FollowModel.followUser({followerUserId, followingUserId});

        return res.send({
            status: 200,
            message: "Follow successful",
            data: dbFollow
        });
    } catch (error) {
        return res.send({
            status: 400,
            message: "Internal server error. Please try again",
            error
        });
    }
});

follow.get('/followinglist/:id', async (req, res) => {
    const followerUserId = req.params.id;
    const offset = req.query.offset || 0;

    if(!followerUserId || !validateMongoDbIds([followerUserId])) {
        return res.send({
            status: 401,
            message: "Missing Parameters. Follower user id shoud be valid"
        });
    }

    try {
        const followingIdList = await FollowModel.getFollowingList({followerUserId, offset, limit: constants.FOLLOWLIMIT});

        const followingUserList = await UserModel.getUserDetailFromUserId(followingIdList);

        return res.send({
            status: 200,
            message: "Read successful",
            data: followingUserList
        });
    } catch (error) {
        return res.send({
            status: 400,
            message: "Internal server error. Please try again",
            error
        });
    }
});

follow.get('/followerlist/:id', async (req, res) => {
    const followingUserId = req.params.id;
    const offset = req.query.offset || 0;

    if(!followingUserId || !validateMongoDbIds([followingUserId])) {
        return res.send({
            status: 401,
            message: "Missing Parameters. Following user id shoud be valid"
        });
    }

    try {
        const followerList = await FollowModel.getFollowerList({followingUserId, offset, limit: constants.FOLLOWLIMIT});

        return res.send({
            status: 200,
            message: "Read successful",
            data: followerList
        });
    } catch (error) {
        return res.send({
            status: 400,
            message: "Internal server error. Please try again",
            error
        });
    }
});

follow.post('/unfollow-user', checkAuth, async (req, res) => {

    const followerUserId = req.session.user.userId;
    const followingUserId = req.body.followingUserId;

    if(!followingUserId || !validateMongoDbIds([followingUserId])) {
        return res.send({
            status: 401,
            message: "Missing Parameters. Following user id shoud be valid"
        });
    }

    if(followingUserId.toString() === followerUserId.toString()) {
        return res.send({
            status: 401,
            message: "Following and follower are same. You cannot unfollow yourself."
        });
    }

    try {
        await UserModel.verifyUserIdExists(followingUserId);
    } catch (error) {
        return res.send({
            status: 400,
            message: "Internal server error",
            error
        });
    }

    try {
        const dbFollow = await FollowModel.verifyfollowExists({followingUserId, followerUserId});

        if(!dbFollow) {
            return res.send({
                status: 401,
                message: "You do not follow this user"
            }); 
        }
    } catch (error) {
        return res.send({
            status: 400,
            message: "Database error",
            error
        });
    }

    try {
        const dbUnfollow = await FollowModel.unfollowUser({followerUserId, followingUserId});

        return res.send({
            status: 200,
            message: "Unfollow successful",
            data: dbUnfollow
        });
    } catch (error) {
        return res.send({
            status: 400,
            message: "Internal server error. Please try again.",
            error
        });
    }
});

module.exports = follow;