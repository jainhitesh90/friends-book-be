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
            var cursor = db.collection('users').find({ email: req.body.email, provider: req.body.provider });
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else if (docs.length > 0) {
                    res.send(utils.successResponse('Welcome back!!', docs[0]))
                } else {
                    var authToken = utils.getToken({ email: req.body.email })
                    /* create profile */
                    db.collection('users').insert({ _id : req.body.uid, email: req.body.email, name: req.body.name, image: req.body.image, provider: req.body.provider, token: req.body.token, authToken: authToken, createdAt: Date.now() }, (err, result) => {
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
                                    if (!error && response.statusCode == 200 && req.body.uid == JSON.parse(response.body).id) {
                                        /* create empty friends row for this user */
                                        const friend = { _id: req.body.uid, friendList: [] };
                                        db.collection('friends').insert(friend, (err, friendResult) => {
                                            if (err) {
                                                res.send(utils.errorResponse(err.errmsg));
                                            } else {
                                                res.send(utils.successResponse('Profile created!!', result.ops[0]))
                                            }
                                        });
                                    }
                                    else
                                        res.send(utils.errorResponse("Invalid facebook token"))
                                })
                            } else {
                                /* create empty friends row for this user */
                                const friend = { _id: req.body.uid, friendList: [] };
                                db.collection('friends').insert(friend, (err, friendResult) => {
                                    if (err) {
                                        res.send(utils.errorResponse(err.errmsg));
                                    } else {
                                        result.ops[0].newUser = true /* 1st time user */
                                        res.send(utils.successResponse('Profile created!!', result.ops[0]))
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }
    });

    /* READ ALL */
    app.get('/users/list', utils.isUserAuthenticated, (req, res) => {
        var cursor = db.collection('users').find({}).sort( { createdAt : -1 } );
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var users = []
                var count = 0;
                if (docs.length > 0) {
                    for (var i = 0; i < docs.length; i++) {
                        if (docs[i]._id != userId) {
                            var userData = {}
                            userData._id = docs[i]._id
                            userData.name = docs[i].name
                            userData.image = docs[i].image
                            users.push(userData)
                        }
                        count++
                        if (count == docs.length) /* Except users own id and his own friends */
                            res.send(utils.successResponse(null, users))
                    }
                } else {
                    res.send(utils.successResponse(null, users))
                }
            }
        });
    });

    /* Set USER's device ids */
    app.put('/users/addDevice', utils.isUserAuthenticated, (req, res) => {
        if (req.body.fcmToken == null) {
            res.send(utils.errorResponse('Token missing'));
        } else {
            const details = { '_id': userId };
            const updatedDeviceId = { $set: { deviceId: req.body.deviceId, fcmToken: req.body.fcmToken } };
            db.collection('users').update(details, updatedDeviceId, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Subscribed for notification successfully', result))
                }
            });
        }
    });

    /* USER PROFILE */
    app.get('/users/profile', utils.isUserAuthenticated, (req, res) => {
        db.collection('users').findOne({ _id: userId }, (function (err, item) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                res.send(utils.successResponse("Yeh le profile", item))
            }
        }));
    });

    /* USER PROFILE by ID*/
    app.get('/users/other-profile/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('User id missing'));
        } else {
            db.collection('users').findOne({ _id: req.params.id }, (function (err, item) {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse("Yeh le profile uska", item))
                }
            }));
        }
    });

    /* USER NOTIFICATIONS */
    app.get('/users/notifications', utils.isUserAuthenticated, (req, res) => {
        var cursor = db.collection('notifications').find({ userId : userId }).sort( { createdAt : -1 } );
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                res.send(utils.successResponse("Notification response", docs))
            }
        });
    });

    /* USER FRIEND SUGGESTIOn */
    app.get('/users/friends-suggestion', utils.isUserAuthenticated, (req, res) => {
        /* fetch all users */
        var cursor = db.collection('users').find({}).sort( { createdAt : -1 } ).project({ _id : 1, name: 1, image : 1 });
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var users = []
                var count = 0;
                if (docs.length > 0) {
                    for (var i = 0; i < docs.length; i++) {
                        if (docs[i]._id != userId) {
                            users.push(docs[i])
                        }
                        count++
                        if (count == docs.length)
                            filterFriends(users, res)
                    }
                } else {
                    res.send(utils.successResponse(null, users))
                }
            }
        });
    });

    /* Filter users from existing frineds */
    var filterFriends = function(users, res){
        var cursor = db.collection('friends').findOne({ _id : userId }, (err, item) => {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var friendList = []
                var count = 0
                if (item.friendList != null && item.friendList.length > 0) {
                    for (var i = 0; i < item.friendList.length; i++) {
                        db.collection('users').findOne({ _id : item.friendList[i]['_id'] }, (function (err, user) {
                            if (err) {
                                console.log("error : " + err.errmsg)
                                count++
                            } else if (user == null) {
                                count++
                            } else {
                                var userData = {}
                                userData._id = user._id
                                userData.name = user.name
                                userData.image = user.image
                                userData.friendStatus = item.friendList[count]['status']
                                var pos = users.map(function (e) { return e._id;}).indexOf(user._id);
                                if (pos != -1)
                                    users.splice(pos,1)
                                count++
                            }
                            if (count == item.friendList.length)
                                res.send(utils.successResponse("Suggestions 1 ", users))
                        }));
                    }
                } else {
                    res.send(utils.successResponse("Suggestions 2 ", users))
                }
            }
        });
    }
};