const TweetSchema = require('../Schemas/TweetSchema');
const constants = require('../constants');

const Tweet = class {
    title;
    text;
    creationDateTime;
    userId;
    tweetId

    constructor({title, text, creationDateTime, userId, tweetId}) {
        this.title = title;
        this.text = text;
        this.creationDateTime = creationDateTime;
        this.userId = userId;
        this.tweetId = tweetId;
    }

    static countTweetOfUser(userId) {
        return new Promise(async (resolve, reject) => {

            try {
                const count = await TweetSchema.count({userId});
                return resolve(count);
            } catch (error) {
                return reject(error);
            }

        });
    }

    static findTweetById(tweetId){
        return new Promise(async (resolve, reject) => {
            try {
                const dbTweet = await TweetSchema.findOne({_id: tweetId});

                return resolve(dbTweet);
            } catch (error) {
                return reject(error);
            }
        });
    }

    static getRecentTweets(offset) {
        return new Promise(async (resolve, reject) => {
            try {
                const dbTweets = await TweetSchema.aggregate([
                    {$sort: {"creationDateTime": -1} },
                    {$facet: {
                        data: [{$skip: parseInt(offset)}, {$limit: constants.TWEETSLIMIT}]
                    }}
                ]);

                return resolve(dbTweets[0].data);
            } catch (error) {
                return reject(error);
            }
        });
    }

    static getTweets({offset, userIds}) {
        return new Promise(async (resolve, reject) => {
            try {
                const dbTweet = await TweetSchema.aggregate([
                    // sort and pagination
                    { $match: { userId: { $in: userIds } } },
                    { $sort: { "creationDateTime": -1 } },
                    { $facet: {
                        data: [
                            {"$skip": parseInt(offset)},
                            {"$limit": constants.TWEETSLIMIT}
                        ]
                    } }
                ]);

                resolve(dbTweet[0].data);
            } catch (error) {
                return reject(error);
            }
        });
    }

    createTweet(){
        return new Promise(async (resolve, reject) => {
            const tweet = new TweetSchema({
                title: this.title,
                text: this.text,
                userId: this.userId,
                creationDateTime: this.creationDateTime
            })

            try {
                const dbTweet = tweet.save();

                return resolve(dbTweet);
            } catch (error) {
                return reject(error);
            }
        });
    }

    updateTweet() {
        return new Promise(async (resolve, reject) => {
            const newTweetData = {};

            if(this.title) {
                newTweetData.title = this.title;
            }

            if (this.text) {
                newTweetData.text = this.text;
            }

            try {
                const dbTweet = await TweetSchema.findOneAndUpdate({_id: this.tweetId}, newTweetData);

                return resolve(dbTweet);
            } catch (error) {
                return reject(error);
            }
        });
    }

    deleteTweet() {
        return new Promise(async (resolve, reject) => {

            try {
                const dbTweet = await TweetSchema.findOneAndDelete({_id: this.tweetId});

                return resolve(dbTweet);
            } catch (error) {
                return reject(error);
            }
        });
    }
}

module.exports = Tweet;