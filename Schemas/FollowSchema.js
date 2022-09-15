const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FollowSchema = new Schema({
    followerUserId: {
        type: String,
        required: true
    },
    followingUserId: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('follow', FollowSchema);