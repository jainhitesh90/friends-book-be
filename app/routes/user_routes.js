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
                email: req.body.email, name: req.body.name, image: req.body.image, provider: req.body.provider, token: req.body.token, uid: req.body.uid, usersFriendList: []
            };
            var cursor = db.collection('users').find({ email: req.body.email, provider: req.body.provider });
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else if (docs.length > 0) {
                    res.send(utils.successResponse('Welcome back!!', docs[0]))
                } else {
                    var authToken = utils.getToken({ email: req.body.email })
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
    app.get('/users/list', utils.isUserAuthenticated, (req, res) => {
        var cursor = db.collection('users').find({});
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var users = []
                var count = 0;
                if (docs.length > 0) {
                    for (var i = 0; i < docs.length; i++) {
                        if (docs[i]._id != userId) {
                            var pos = usersFriendList.map(function (e) { return e._id; }).indexOf(docs[i]._id);
                            if (pos == -1) {
                                var userData = {}
                                userData._id = docs[i]._id
                                userData.name = docs[i].name
                                userData.image = docs[i].image
                                users.push(userData)
                            }
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

    /* User's friend */
    app.get('/users/friends', utils.isUserAuthenticated, (req, res) => {
        db.collection('users').findOne({ _id: userId }, (function (err, item) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var friendList = []
                var count = 0
                if (item.usersFriendList != null && item.usersFriendList.length > 0) {
                    for (var i = 0; i < item.usersFriendList.length; i++) {
                        db.collection('users').findOne({ _id: item.usersFriendList[i]['_id'] }, (function (err, user) {
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
                                userData.friendStatus = item.usersFriendList[count]['status']
                                friendList.push(userData)
                                count++
                            }
                            if (count == item.usersFriendList.length)
                                res.send(utils.successResponse("Yeh le tere friends ", friendList))
                        }));
                    }
                } else {
                    res.send(utils.successResponse("You have no friends ", friendList))
                }
            }
        }));
    });

    /* Add Friend */
    app.put('/user/addFriend', utils.isUserAuthenticated, (req, res) => {
        if (req.body._id == null || req.body._id == '') {
            res.send(utils.errorResponse('Id missing'));
        } else {
            const details = { '_id': userId };
            const friendRequest = { _id: req.body._id, status: 'Request Sent' };
            db.collection('users').update(details, { "$push": { usersFriendList: friendRequest } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Friend added', result))
                }
            });
        }
    });

    /* Accept Friend */
    app.put('/user/acceptFriend', utils.isUserAuthenticated, (req, res) => {
        if (req.body._id == null || req.body._id == '') {
            res.send(utils.errorResponse('Id missing'));
        } else {
            const details = { '_id': userId };
            const friendRequestOldState = { _id: req.body._id, status: 'Request Sent' };
            const friendRequestUpdate = { _id: req.body._id, status: 'Friends' };
            db.collection('users').findOne({ _id: userId }, (function (err, item) {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    var friendList = item.usersFriendList
                    var count = 0
                    if (item.usersFriendList != null && item.usersFriendList.length > 0) {
                        for (var i = 0; i < item.usersFriendList.length; i++) {
                            if (item.usersFriendList[i]['_id'] == req.body._id && item.usersFriendList[i]['status'] == 'Request Sent') {
                                db.collection('users').update(details, { "$pull": { usersFriendList: friendRequestOldState } }, (err, result) => {
                                    if (err) {
                                        res.send(utils.errorResponse(err.errmsg));
                                    } else {
                                        db.collection('users').update(details, { "$push": { usersFriendList: friendRequestUpdate } }, (err, result) => {
                                            if (err) {
                                                res.send(utils.errorResponse(err.errmsg));
                                            } else {
                                                res.send(utils.successResponse('Friend Request added', result))
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    } else {
                        res.send(utils.successResponse("Friend request not found", friendList))
                    }
                }
            }));
        }
    });

    /* Remove Friend */
    app.put('/user/unFriend', utils.isUserAuthenticated, (req, res) => {
        if (req.body._id == null || req.body._id == '') {
            res.send(utils.errorResponse('Id missing'));
        } else {
            const details = { '_id': userId };
            const friendRequestOldState = { _id: req.body._id, status: 'Request Sent' };
            db.collection('users').update(details, { "$pull": { usersFriendList: friendRequestOldState } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Friend removed', result))
                }
            });
        }
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
            db.collection('users').findOne({ _id: Number(req.params.id) }, (function (err, item) {
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
        var notificationList = [], activityText = [], feedId = [], time = []
        var count = 0
        var cursor = db.collection('notifications').find({ feedOwnerId: userId });
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var notificationListLength = docs.length
                if (notificationListLength == 0) {
                    res.send(utils.successResponse("Notification response", notificationList))
                } else {
                    for (i = 0; i < notificationListLength; i++) {
                        activityText.push(docs[i].activity)
                        feedId.push(docs[i].feedId)
                        time.push(docs[i].createdAt)
                        db.collection('users').aggregate([{
                            $lookup: {
                                from: docs[i].userId.toString(), localField: "_id", foreignField: "userId", as: "feed_comments"
                            }
                        }], function (err, results) {
                            if (err) {
                                res.send(utils.errorResponse(err.errmsg));
                            } else {
                                var notificationSection = {}
                                notificationSection.name = results[0].name
                                notificationSection.feedId = feedId[count]
                                notificationSection.time = time[count]
                                notificationSection.activity = activityText[count]
                                notificationList.push(notificationSection);
                                count++
                                if (notificationList.length == notificationListLength) {
                                    res.send(utils.successResponse("Notification response", notificationList))
                                }
                            }
                        });
                    }
                }
            }
        });
    });
};