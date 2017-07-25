const utils = require('../../utils/utils.js')

module.exports = function (app, db) {
    utils.setdatabase(db)
    var ObjectID = require('mongodb').ObjectID;
    var request = require('request');

    /* SIGNUP / LOGIN */
    app.post('/user/signup', (req, res) => {
        if (req.body.email == null || req.body.email == '') {
            res.send(utils.errorResponse('Email Id missing'));
        } else if (req.body.name == null || req.body.name == '') {
            res.send(utils.errorResponse('Name missing'));
        } else if (req.body.image == null || req.body.image == '') {
            res.send(utils.errorResponse('Image url missing'));
        } else if (req.body.provider == null || req.body.provider == '') {
            res.send(utils.errorResponse('Provider missing'));
        } else if (req.body.uid == null || req.body.uid == '') {
            res.send(utils.errorResponse('UID missing'));
        } else {
            var userObject = {
                email: req.body.email, name: req.body.name, image: req.body.image, provider: req.body.provider, token: req.body.token, uid: req.body.uid
            };
            var cursor = db.collection('users').find({ email: req.body.email, provider: req.body.provider });
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else if (docs.length > 0) {
                    res.send(utils.successResponse('Welcome back!!', docs[0]))
                } else {
                    var authToken = utils.getToken(userObject)
                    /* get user's incremented id */
                    database.collection("counters").findAndModify(
                        { _id: "userId" }, [], { $inc: { lastUserId: 1 } }, { new: true },    // query
                        function (err, doc) {
                            if (!err) {
                                /* create profile */
                                db.collection('users').insert({ _id: doc.value.lastUserId, email: req.body.email, name: req.body.name, image: req.body.image, provider: req.body.provider, token: req.body.token, uid: req.body.uid, authToken: authToken }, (err, result) => {
                                    if (err) {
                                        if (String(err.errmsg).includes('duplicate')) // duplicate email id
                                            if (req.body.provider == 'facebook')
                                                res.send(utils.errorResponse("Please login via gmail, you've registered using your gmail account"));
                                            else
                                                res.send(utils.errorResponse("Please login via facebook, you've registered using your facebook account"));
                                        else
                                            res.send(utils.errorResponse(err.errmsg))
                                    } else {
                                        /* validate facebook token and id */
                                        if (req.body.provider == 'facebook') {
                                            request("https://graph.facebook.com/me?access_token=" + req.body.token, function (error, response, body) {
                                                if (!error && response.statusCode == 200 && req.body.uid == JSON.parse(response.body).id)
                                                    res.send(utils.successResponse('Profile created!!', result.ops[0]))
                                                else
                                                    res.send(utils.errorResponse("Invalid facebook token"))
                                            })
                                        } else {
                                            res.send(utils.successResponse('Profile created!!', result.ops[0]))
                                        }
                                    }
                                });
                            } else {
                                res.utils.errorResponse("Unable to generate user id")
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
                res.send(utils.errorResponse(err.errmsg));
            } else {
                res.send(utils.successResponse(null, docs))
            }
        });
    });

    /* USER PROFILE */
    app.get('/users/profile', (req, res) => {
        db.collection('users').findOne({ authToken: req.get('authToken') }, (function (err, item) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                res.send(utils.successResponse("Yeh le profile", item))
            }
        }));
    });
};