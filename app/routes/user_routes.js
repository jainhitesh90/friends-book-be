module.exports = function (app, db) {
    var ObjectID = require('mongodb').ObjectID;

    /* SIGNUP / LOGIN */
    app.post('/user/signup', (req, res) => {
        if (req.body.email == null || req.body.email == '') {
            res.send(errorResponse('Email Id missing'));
        } else if (req.body.name == null || req.body.name == '') {
            res.send(errorResponse('Name missing'));
        } else if (req.body.image == null || req.body.image == '') {
            res.send(errorResponse('Image url missing'));
        } else if (req.body.provider == null || req.body.provider == '') {
            res.send(errorResponse('Provider missing'));
        } else if (req.body.uid == null || req.body.uid == '') {
            res.send(errorResponse('UID missing'));
        } else {
            var cursor = db.collection('users').find({
                email: req.body.email,
                name: req.body.name,
                image: req.body.image,
                provider: req.body.provider,
                token: req.body.token,
                uid: req.body.uid
            });
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else if (docs.length > 0) {
                    res.send(successResponse('Welcome back!!', docs[0]))
                } else {
                    /* create profile */
                    const userObject = {
                        email: req.body.email,
                        name: req.body.name,
                        image: req.body.image,
                        provider: req.body.provider,
                        token: req.body.token,
                        uid: req.body.uid
                    };
                    var authToken = getToken(userObject)
                    db.collection('users').insert(userObject, (err, result) => {
                        if (err) {
                            if (String(err.errmsg).includes('duplicate')) // duplicate email id
                                if (req.body.provider == 'facebook')
                                    res.send(errorResponse("Please login via gmail, you've registered using your gmail account"));
                                else
                                    res.send(errorResponse("Please login via facebook, you've registered using your facebook account"));
                            else
                                res.send(errorResponse(err.errmsg))
                        } else {
                            res.send(successResponse('Profile created!!', result.ops[0]))
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