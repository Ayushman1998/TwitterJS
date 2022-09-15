const ObjectId = require('mongodb').ObjectId;

function validateMongoDbIds(ids) {

    for(let id of ids) {    
        if(!id) {
            return false;
        }
    
        if(!ObjectId.isValid(id)) {
            return false;
        }
    }

    return true;
}

module.exports = { validateMongoDbIds };