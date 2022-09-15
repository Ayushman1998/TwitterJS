const FollowSchema = require('../Schemas/FollowSchema');

function followUser({ followerUserId, followingUserId}) {
    return new Promise(async (resolve, reject) => {
        try {
            const follow = new FollowSchema({
                followerUserId,
                followingUserId
            });
    
            const dbFollow = await follow.save();
            return resolve(dbFollow);
        } catch (error) {
            return reject(error);
        }
    });
}

function getFollowingList({followerUserId, offset, limit}) {
    return new Promise(async (resolve, reject) => {
        try {
            const followingList = await FollowSchema.aggregate([
                { $match: { followerUserId } },
                { $project: { _id: 0, followingUserId: 1 } }, // this will send only followinglist
                { $facet: { data: [ {"$skip": parseInt(offset)}, { "$limit": limit } ]} }
            ]);

            const followingListArray = [];
            followingList[0].data.forEach((item) => {
                followingListArray.push(item.followingUserId);
            });

            return resolve(followingListArray);
        } catch(error) {
            return reject(error);
        }
    });
}

function getFollowerList({followingUserId, offset, limit}) {
    return new Promise(async (resolve, reject) => {
        try {
            const followerList = await FollowSchema.aggregate([
                { $match: { followingUserId } },
                { $project: { _id: 0, followerUserId: 1 } },
                { $facet: { data: [ {"$skip": parseInt(offset)}, { "$limit": limit } ]} }
            ]);

            const followerListArray = [];
            followerList[0].data.forEach((item) => {
                followerListArray.push(item.followerUserId);
            });

            return resolve(followerListArray);
        } catch(error) {
            return reject(error);
        }
    });
}

function unfollowUser({followingUserId, followerUserId}) {
    return new Promise(async (resolve, reject) => {
        try {
            const dbUnfollow = await FollowSchema.findOneAndDelete({followerUserId, followingUserId});

            if(!dbUnfollow) {
                return reject("User does not exist");
            }

            return resolve(dbUnfollow)
        } catch (error) {
            reject(error);
        }
    });
}

function verifyfollowExists({followingUserId, followerUserId}) {
    return new Promise(async (resolve, reject) => {
        try {
            const dbFollow = await FollowSchema.findOne({followerUserId, followingUserId});

            return resolve(dbFollow);
        } catch (error) {
            return reject(error);
        }
    });
}

module.exports = { followUser, getFollowerList, getFollowingList, unfollowUser, verifyfollowExists };