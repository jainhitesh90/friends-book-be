const db = require('../../config/db');
var jwt = require('jsonwebtoken');

module.exports = function (app, db) {
    var ObjectID = require('mongodb').ObjectID;

    /* Admin signup */
    app.post('/admin/signup', (req, res) => {
        if (req.body.userName == null || req.body.userName == '') {
            res.send(errorResponse('user name missing'));
        } else if (req.body.password == null || req.body.password == '') {
            res.send(errorResponse('password missing'));
        } else {
            var authToken = getToken({ userName: req.body.userName, password: req.body.password })
            console.log("authToken : " + authToken)
            const adminObject = { userName: req.body.userName, authToken: authToken };
            db.collection('admin').insert(adminObject, (err, result) => {
                if (err) {
                    if (String(err.errmsg).includes('duplicate')) // duplicate userName
                        res.send(errorResponse("Username already exist"));
                    else
                        res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse("Admin created successfully", result.ops[0]))
                }
            });
        }
    });

    /* Admin login*/
    app.post('/admin/login', (req, res) => {
        if (req.body.userName == null || req.body.userName == '') {
            res.send(errorResponse('user name missing'));
        } else if (req.body.password == null || req.body.password == '') {
            res.send(errorResponse('password missing'));
        } else {
            const adminObject = { userName: req.body.userName };
            var cursor = db.collection('admin').find(adminObject);
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else if (docs.length == 0) {
                    res.send(errorResponse("Username not found"));
                } else {
                    var decryptedAdminObject = decryptPassword(docs[0].authToken)
                    if (decryptedAdminObject != null && decryptedAdminObject.password != null) {
                        if (req.body.password == decryptedAdminObject.password)
                            res.send(successResponse('Welcome Admin!! ', docs[0]))
                        else
                            res.send(errorResponse("Invalid password"));
                    } else {
                        res.send(errorResponse("Invalid secret key"));
                    }
                }
            });
        }
    });
};

/* encode userObject */
function getToken(userObject) {
    return jwt.sign(userObject, db.secretKey, { expiresIn: 365 * 24 * 60 });
}

/* decode authToken */
function decryptPassword(token) {
    var decryptedAdminObject = jwt.verify(token, db.secretKey)
    if (decryptedAdminObject != null)
        return decryptedAdminObject.password
    else
        return null
}

function errorResponse(errorMsg) {
    return { success: false, error: errorMsg }
}

function successResponse(message, data) {
    if (data != null && message != null)
        return { success: true, message: message, data: data }
    else if (data != null)
        return { success: true, data: data }
    if (message != null)
        return { success: true, message: message }
}