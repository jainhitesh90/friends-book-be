module.exports = function (app, db) {
    var ObjectID = require('mongodb').ObjectID;

    /* SIGNUP or LOGIN */
    app.post('/user/login', (req, res) => {
        if (req.body.email == null || req.body.email == '') {
            res.send(errorResponse('Email Id missing')); 
        } else {
            const user = { email: req.body.email };
            var cursor = db.collection('users').find(user);
            cursor.toArray(function (err, docs) {
                if (docs.length > 0) {
                    res.send(successResponse('Welcome back!!' , docs[0]))
                } else {
                    var token = getToken(req.body.email)
                    const userObject = { email: req.body.email, token: token };
                    db.collection('users').insert(userObject, (err, result) => {
                        if (err) {
                            res.send(errorResponse(err.errmsg));
                        } else {
                            res.send(successResponse('Profile created!!' , result.ops[0]))
                        }
                    });
                }
            });
        }
    });

    /* READ ALL */
    app.get('/users/list', (req, res) => {
        var cursor = db.collection('users').find({});
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(errorResponse(err.errmsg));
            } else {
                res.send(successResponse(null, docs))
            }
        });
    });
};

/* get AWT token */
function getToken(email) {
    const db = require('../../config/db');
    var jwt = require('jsonwebtoken');
    var token = jwt.sign({ email: email }, db.secretKey, {
        expiresIn: 365 * 24 * 60  // expires in 1 year
    });
    return token;
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