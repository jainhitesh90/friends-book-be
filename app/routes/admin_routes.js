module.exports = function (app, db) {
    var ObjectID = require('mongodb').ObjectID;

    /* SIGNUP ADMIN */
    app.post('/admin/login', (req, res) => {
        if (req.body.userName == null || req.body.userName == '') {
            res.send(errorResponse('user name missing'));
        } else if (req.body.password == null || req.body.password == '') {
            res.send(errorResponse('password missing'));
        } else {
            const admin = { userName : req.body.userName, password: req.body.password};
            var cursor = db.collection('admin').find(admin);
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else if (docs.length > 0) {
                    res.send(successResponse('Welcome Admin!! ', docs[0]))
                } else {
                    res.send(errorResponse("incorrect username/password")); 
                }
            });
        }
    });

    /* Admin login*/
    app.post('/admin/signup', (req, res) => {
        if (req.body.userName == null || req.body.userName == '') {
            res.send(errorResponse('user name missing'));
        } else if (req.body.password == null || req.body.password == '') {
            res.send(errorResponse('password missing'));
        } else {
            const admin = { userName : req.body.userName, password: req.body.password};
            db.collection('admin').insert(admin, (err, result) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse("Admin created successfully", result.ops[0]))
                }
            });
        }
    });
};

/* get AWT authToken */
function getToken(userObject) {
    const db = require('../../config/db');
    var jwt = require('jsonwebtoken');
    var authToken = jwt.sign(userObject, db.secretKey, {
        expiresIn: 365 * 24 * 60  // expires in 1 year
    });
    return authToken;
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