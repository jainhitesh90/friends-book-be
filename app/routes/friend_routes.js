const utils = require('../../utils/utils.js')
const constants = require('../../utils/constants.js')

module.exports = function (app, db) {
    utils.setdatabase(db)
    var ObjectID = require('mongodb').ObjectID;

    /* Send Request Friend */
    app.post('/friend/send-request', utils.isUserAuthenticated, (req, res) => {
        if (req.body.id == null || req.body.id == '') {
            res.send(utils.errorResponse('Id missing'));
        } else {
            /* update send request */
            db.collection('friends').update({ '_id': userId }, { "$push": { friendList: { _id: req.body.id, status: 'Sent' } } }, (err, result1) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    /* update recieved request */
                    db.collection('friends').update({ '_id': req.body.id }, { "$push": { friendList: { _id: userId, status: 'Recieved' } } }, (err, result2) => {
                        if (err) {
                            res.send(utils.errorResponse(err.errmsg));
                        } else {
                            sendNotificationToUser(req.body.id, userName + " " + constants.frnd_req_sent, constants.activity_frnd_req_sent, '/home/friends');
                            res.send(utils.successResponse('Friend request sent successfully', null))
                        }
                    });
                }
            });
        }
    });

    /* Un-Friend */
    app.post('/friend/un-friend', utils.isUserAuthenticated, (req, res) => {
        if (req.body.id == null || req.body.id == '') {
            res.send(utils.errorResponse('Id missing'));
        } else {
            /* update send request */
            db.collection('friends').findOne({ _id: userId }, (function (err, item) {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else if (item == null) {
                    res.send(utils.errorResponse("Friend not found 1"));
                } else {
                    var pos = item.friendList.map(function (e) { return e._id; }).indexOf(req.body.id);
                    if (pos != -1) {
                        item.friendList.splice(pos, 1)
                        updatedDoc = { $set: { friendList: item.friendList } };
                        db.collection('friends').update({ _id: userId }, updatedDoc, (err, result) => {
                            if (err) {
                                res.send(utils.errorResponse(err.errmsg));
                            } else {
                                /* start 2nd doc */
                                db.collection('friends').findOne({ _id: req.body.id }, (function (err, item) {
                                    if (err) {
                                        res.send(utils.errorResponse(err.errmsg));
                                    } else if (item == null) {
                                        res.send(utils.errorResponse("Friend not found 1"));
                                    } else {
                                        var pos = item.friendList.map(function (e) { return e._id; }).indexOf(userId);
                                        if (pos != -1) {
                                            item.friendList.splice(pos, 1)
                                            updatedDoc = { $set: { friendList: item.friendList } };
                                            db.collection('friends').update({ _id: req.body.id }, updatedDoc, (err, result) => {
                                                if (err) {
                                                    res.send(utils.errorResponse(err.errmsg));
                                                } else {
                                                    res.send(utils.successResponse("We are no more friends", null))
                                                }
                                            });
                                        } else {
                                            res.send(utils.errorResponse("Friend not found 2"));
                                        }
                                    }
                                }));
                                /* end   2nd doc */
                            }
                        });
                    } else {
                        res.send(utils.errorResponse("Friend not found 2"));
                    }
                }
            }));
        }
    });

    /* Accept Friend Request */
    app.post('/friend/accept-request', utils.isUserAuthenticated, (req, res) => {
        if (req.body.id == null || req.body.id == '') {
            res.send(utils.errorResponse('Id missing'));
        } else {
            /* update send request */
            db.collection('friends').findOne({ _id: userId }, (function (err, item) {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else if (item == null) {
                    res.send(utils.errorResponse("Friend not found 1"));
                } else {
                    var pos = item.friendList.map(function (e) { return e._id; }).indexOf(req.body.id);
                    if (pos != -1 && item.friendList[pos].status == 'Recieved') {
                        item.friendList[pos].status = 'Friends'
                        updatedDoc = { $set: { friendList: item.friendList } };
                        db.collection('friends').update({ _id: userId }, updatedDoc, (err, result) => {
                            if (err) {
                                res.send(utils.errorResponse(err.errmsg));
                            } else {
                                /* start 2nd doc */
                                db.collection('friends').findOne({ _id: req.body.id }, (function (err, item) {
                                    if (err) {
                                        res.send(utils.errorResponse(err.errmsg));
                                    } else if (item == null) {
                                        res.send(utils.errorResponse("Friend not found 1"));
                                    } else {
                                        var pos = item.friendList.map(function (e) { return e._id; }).indexOf(userId);
                                        if (pos != -1 && item.friendList[pos].status == 'Sent') {
                                            item.friendList[pos].status = 'Friends'
                                            updatedDoc = { $set: { friendList: item.friendList } };
                                            db.collection('friends').update({ _id: req.body.id }, updatedDoc, (err, result) => {
                                                if (err) {
                                                    res.send(utils.errorResponse(err.errmsg));
                                                } else {
                                                    sendNotificationToUser(req.body.id, userName + " " + '/home/friends');
                                                    res.send(utils.successResponse("We are now friends", null))
                                                }
                                            });
                                        } else {
                                            res.send(utils.errorResponse("Friend not found 2"));
                                        }
                                    }
                                }));
                                /* end   2nd doc */
                            }
                        });
                    } else {
                        res.send(utils.errorResponse("Friend not found 2"));
                    }
                }
            }));
        }
    });

    /* Friend list */
    app.get('/friend/list', utils.isUserAuthenticated, (req, res) => {
        var cursor = db.collection('friends').findOne({ _id: userId }, (err, item) => {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var friendList = []
                var count = 0
                if (item.friendList != null && item.friendList.length > 0) {
                    for (var i = 0; i < item.friendList.length; i++) {
                        db.collection('users').findOne({ _id: item.friendList[i]['_id'] }, (function (err, user) {
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
                                friendList.push(userData)
                                count++
                            }
                            if (count == item.friendList.length)
                                res.send(utils.successResponse("Yeh le tere friends ", friendList))
                        }));
                    }
                } else {
                    res.send(utils.successResponse("You have no friends ", friendList))
                }
            }
        });
    });

    var sendNotificationToUser = function (userId, content,activity, redirectUrl) {
        db.collection('users').findOne({ _id : userId }, (function (err, item) {
            if (err) {
                console.log(err.errmsg)
            } else if (item == null) {
                console.log("User not found")
            } else {
                var id = item._id
                var fcmToken = item.fcmToken
                const notificationService = require('../../services/fcm-notification.js')
                notificationService.updateNotificationDocument(db, id, fcmToken, content, activity, redirectUrl)
            }
        }));
    }
};