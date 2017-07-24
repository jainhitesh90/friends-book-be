var database = null, newUserId;

module.exports = function (app, db) {
    database = db;
    var ObjectID = require('mongodb').ObjectID;
    var request = require('request');

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
            var userObject = {
                email: req.body.email, name: req.body.name, image: req.body.image, provider: req.body.provider, token: req.body.token, uid: req.body.uid
            };
            var cursor = db.collection('users').find({ email: req.body.email, provider: req.body.provider });
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else if (docs.length > 0) {
                    res.send(successResponse('Welcome back!!', docs[0]))
                } else {
                    var authToken = getToken(userObject)
                    /* get user's incremented id */
                    database.collection("counters").findAndModify(
                        { _id: "userId" }, [], { $inc: { sequence_value: 1 } }, { new: true },    // query
                        function (err, doc) {
                            if (!err) {
                                /* create profile */
                                db.collection('users').insert({ _id: doc.value.sequence_value, email: req.body.email, name: req.body.name, image: req.body.image, provider: req.body.provider, token: req.body.token, uid: req.body.uid, authToken: authToken }, (err, result) => {
                                    if (err) {
                                        if (String(err.errmsg).includes('duplicate')) // duplicate email id
                                            if (req.body.provider == 'facebook')
                                                res.send(errorResponse("Please login via gmail, you've registered using your gmail account"));
                                            else
                                                res.send(errorResponse("Please login via facebook, you've registered using your facebook account"));
                                        else
                                            res.send(errorResponse(err.errmsg))
                                    } else {
                                        /* validate facebook token and id */
                                        if (req.body.provider == 'facebook') {
                                            request("https://graph.facebook.com/me?access_token=" + req.body.token, function (error, response, body) {
                                                if (!error && response.statusCode == 200 && req.body.uid == JSON.parse(response.body).id)
                                                    res.send(successResponse('Profile created!!', result.ops[0]))
                                                else
                                                    res.send(errorResponse("Invalid facebook token"))
                                            })
                                        } else {
                                            res.send(successResponse('Profile created!!', result.ops[0]))
                                        }
                                    }
                                });
                            } else {
                                res.errorResponse("Unable to generate user id")
                            }
                        }
                    );
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

    /* USER PROFILE */
    app.get('/users/profile', (req, res) => {
        db.collection('users').findOne({ authToken: req.get('authToken') }, (function (err, item) {
            if (err) {
                res.send(errorResponse(err.errmsg));
            } else {
                res.send(successResponse("Yeh le profile", item))
            }
        }));
    });
};

/* get AWT authToken */
function getToken(userObject) {
    const credentials = require('../../config/credentials');
    var jwt = require('jsonwebtoken');
    var authToken = jwt.sign(userObject, credentials.secretKey, {
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