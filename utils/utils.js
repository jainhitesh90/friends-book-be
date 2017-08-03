module.exports = {
    database: null,
    userId: null,

    /* set database */
    setdatabase: function (db) {
        database = db
    },

    /* send success response to client */
    successResponse: function (message, data) {
        if (data != null && message != null)
            return { success: true, message: message, data: data }
        else if (data != null)
            return { success: true, data: data }
        if (message != null)
            return { success: true, message: message }
    },

    /* send error response to client */
    errorResponse: function (errorMsg) {
        return { success: false, error: errorMsg }
    },

    /* validate admin token */
    isAdminAuthenticated: function (req, res, next) {
        if (req.get('authToken') == null)
            res.send(module.exports.errorResponse("Token is not present"));
        else {
            var authToken = req.get('authToken')
            var cursor = database.collection('admin').find({ authToken: authToken });
            cursor.toArray(function (err, docs) {
                if (docs.length == 0) {
                    res.send(module.exports.errorResponse("Admin Token invalid"));
                } else if (docs.length > 0) {
                    return next();
                }
            });
        }
    },

    /* validate user token */
    isUserAuthenticated: function (req, res, next) {
        if (req.get('authToken') == null)
            res.send(module.exports.errorResponse("Token is not present"));
        else {
            var authToken = req.get('authToken')
            database.collection('users').findOne({ authToken: req.get('authToken') }, (function (err, item) {
                if (err) {
                    res.send(module.exports.errorResponse("Token invalid"));
                } else if (item != null) {
                    userId = item._id
                    userName = item.name
                    fcmToken = item.fcmToken
                    return next();
                } else {
                    res.send(module.exports.errorResponse("Token Invalid"));
                }
            }));
        }
    },

    /* encode userObject */
    getToken: function (userObject) {
        var jwt = require('jsonwebtoken');
        const credentials = require('../config/credentials');
        return jwt.sign(userObject, credentials.secretKey, { expiresIn: 365 * 24 * 60 });
    },

    /* decode authToken */
    decryptPassword: function (token) {
        var jwt = require('jsonwebtoken');
        const credentials = require('../config/credentials');
        var decryptedAdminObject = jwt.verify(token, credentials.secretKey)
        if (decryptedAdminObject != null) {
            return decryptedAdminObject.password
        } else {
            return null
        }
    }
};