const validator = require('validator');

// passing values as object in js we dont need to remember the order of data
function cleanUpAndValidate({ uname, username, email, password, phone }) {
    // we return a promise if data is valid
    return new Promise((resolve, reject) => {

        if (typeof (email) !== 'string')
            reject('Invalid Email');
        if (typeof (username) !== 'string')
            reject('Invalid Username');
        if (typeof (uname) !== 'string')
            reject('Invalid Name');
        if (typeof (password) !== 'string')
            reject('Invalid Password');

        // Empty strings evaluate to false
        if (!username || !password || !uname || !email) {
            reject('Invalid Data');

            if (username.length < 3 || username.length > 100)
                reject('Username should be 3 to 100 characters in length');

            if (password.length < 8 || password.length > 100)
                reject('Password should be 8 to 100 characters in length');
        }

        if (!validator.isEmail(email)) {
            reject('Invalid Email');
        }

        if (phone !== undefined && typeof (phone) !== 'string')
            if (phone.length !== 10)
                reject('Invalid Phone');

        resolve('Valid Data');
    });
}

module.exports = { cleanUpAndValidate };