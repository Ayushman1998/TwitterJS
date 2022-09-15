const bcrypt = require('bcrypt');
const validator = require('validator');
const ObjectId = require('mongodb').ObjectId;

const UserSchema = require('../Schemas/UserSchema');

let User = class {
    username;
    email;
    password;
    phoneNumber;
    name;
    profilePic;

    constructor({ username, name, email, password, phoneNumber, profilePic }) {
        this.username = username;
        this.name = name;
        this.email = email;
        this.password = password;
        this.phoneNumber = phoneNumber;
        this.profilePic = profilePic;
    }

    static verifyUsernameAndEmailExists({ username, email }) {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await UserSchema.findOne({ $or: [{ username }, { email }] });

                if (!user) {
                    return resolve();
                }

                if (user && user.email === email) {
                    return reject("User with email already exists");
                }

                if (user && user.username === username) {
                    return reject("User with username already exists");
                }

                return reject('Some unknown error occured');
            } catch (error) {
                return reject(error);
            }
        });
    }

    static verifyUserIdExists(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                const dbUser = await UserSchema.findOne({_id: userId});

                if(!dbUser)
                    return reject("User does not exist");
                
                return resolve(dbUser);
            } catch(error) {
                return reject(error);
            }
        });
    }

    static findUserWithLoginId(loginId) {
        return new Promise(async (resolve, reject) => {

            let dbUser;

            try {
                if (validator.isEmail(loginId)) {
                    dbUser = await UserSchema.findOne({ email: loginId }); // if directly loginId is send it checks with all keys
                } else {
                    dbUser = await UserSchema.findOne({ username: loginId });
                }
            } catch (error) {
                return reject("Database error");
            }

            if (!dbUser) {
                return reject("No user found");
            }

            return resolve(dbUser);

        });
    }

    static getUserDetailFromUserId(userIdArray) {
        return new Promise(async (resolve, reject) => {
            try {
                const userObjectIdArray = [];
                userIdArray.forEach(item => {
                    userObjectIdArray.push(ObjectId(item));
                });

                const followingUserDetails =  await UserSchema.aggregate([
                    { $match: { _id: {$in: userObjectIdArray } }},
                    { $project: {
                        username: 1,
                        name: 1
                    } }
                ]);
                // console.log(followingUserDetails);

                resolve(followingUserDetails);
            } catch (error) {
                reject(error);
            }
        });
    }

    registerUser() {
        return new Promise(async (resolve, reject) => {
            const hashedPassword = await bcrypt.hash(this.password, 12);

            const user = new UserSchema({
                username: this.username,
                email: this.email,
                name: this.name,
                password: hashedPassword,
                phoneNumber: this.phoneNumber,
                profilePic: this.profilePic
            });

            try {
                const dbUser = await user.save();

                return resolve(dbUser)
            } catch (error) {
                return reject(error);
            }
        });
    }
}

module.exports = User;