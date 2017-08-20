const utils = require('../../utils/utils.js')
const constants = require('../../utils/constants.js')
var multer = require('multer')
var upload = multer({ dest: 'uploads/' })
async = require("async");

module.exports = function (app, db) {
    utils.setdatabase(db)
    var ObjectID = require('mongodb').ObjectID;

    /* CREATE FEED (Admin)*/
    app.post('/feed/admin/add', [utils.isAdminAuthenticated, upload.single('content')], (req, res) => {
        if (req.body.description == null || req.body.description == '') {
            res.send(utils.errorResponse('Description missing'));
        } else if (req.body.url == null || req.body.url == '') {
            res.send(utils.errorResponse('Url missing'));
        } else if (req.body.image == null || req.body.image == '') {
            res.send(utils.errorResponse('Image URL missing'));
        } else {
            switch (req.body.feedType) {
                case 'event' :
                    if (req.body.venue == null || req.body.venue == '') {
                        res.send(utils.errorResponse('Venue missing'));
                    } else if (req.body.price == null || req.body.price == '') {
                        res.send(utils.errorResponse('Price missing'));
                    } else if (req.body.time == null || req.body.time == '') {
                        res.send(utils.errorResponse('Time missing'));
                    } else {
                        const event = { feedType: req.body.feedType, description: req.body.description, venue: req.body.venue, price: req.body.price, time: req.body.time, url: req.body.url, image: req.body.image, createdAt: Date.now() };
                        db.collection('feeds').insert(event, (err, result) => {
                            if (err) {
                                res.send(utils.errorResponse(err.errmsg));
                            } else {
                                res.send(utils.successResponse(null, result.ops[0]))
                            }
                        });
                    }
                    break;
                case 'blog' :
                    const blog = { feedType: req.body.feedType, description: req.body.description, url: req.body.url, image: req.body.image, createdAt: Date.now() };
                    db.collection('feeds').insert(blog, (err, result) => {
                        if (err) {
                            res.send(utils.errorResponse(err.errmsg));
                        } else {
                            res.send(utils.successResponse(null, result.ops[0]))
                        }
                    });
                    break;
                default : res.send(utils.errorResponse("Feed type invalid"));
                    break
            }
        }
    });

    /* CREATE (User)*/
    app.post('/feed/add', [utils.isUserAuthenticated, upload.single('content')], (req, res) => {
        var AWS = require('aws-sdk');
        AWS.config.loadFromPath('./config/aws-config.json');
        const configFile = require('../../config/credentials');
        var s3Bucket = new AWS.S3({ params: { Bucket: configFile.s3BucketName } })
        var fs = require('fs');
        var file = req.file;
        if (req.body.feedType == 'post') {
            if (req.body.description == null || req.body.description == '') {
                res.send(utils.errorResponse('Describe your feed'))
            } else if (file == null || file.path == null) {
                const feed = { feedType: req.body.feedType, userId: userId, description : req.body.description, createdAt: Date.now() };
                db.collection('feeds').insert(feed, (err, result) => {
                    if (err) {
                        res.send(utils.errorResponse(err.errmsg));
                    } else {
                        res.send(utils.successResponse("Feed added successfully", result.ops[0]))
                    }
                });
            } else {
                fs.readFile(file.path, function (err, data) {
                    if (err) throw err; // Something went wrong!
                    s3Bucket.createBucket(function () {
                        var params = null
                        if (req.body.contentType == 'image')
                            params = { Key: file.filename, Body: data, ContentType: 'image/png', ACL: 'public-read' };
                        else if (req.body.contentType == 'video')
                            params = { Key: file.filename, Body: data, ContentType: 'video', ACL: 'public-read' };
                        s3Bucket.upload(params, function (err, data) {
                            fs.unlink(file.path, function (err) {
                                if (err) { console.error(err); }
                            });
                            if (err) {
                                res.send(utils.errorResponse('Something went wrong!!'))
                            } else {
                                const feed = { feedType: req.body.feedType, userId: userId, contentType: req.body.contentType, description: req.body.description, contentUrl: data['Location'], createdAt: Date.now() };
                                db.collection('feeds').insert(feed, (err, result) => {
                                    if (err) {
                                        res.send(utils.errorResponse(err.errmsg));
                                    } else {
                                        res.send(utils.successResponse("Feed added successfully", result.ops[0]))
                                    }
                                });
                            }
                        });
                    });
                });
            }
        } else {
            res.send(utils.errorResponse("Feed type invalid"));
        }
    });

    /* UPDATE */
    app.put('/feed/update/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            var updatedDoc = {}
            if (req.body.feedType == 'post') {
                if (req.body.description == null || req.body.description == '') {
                    res.send(utils.errorResponse('Please add some description'))
                } else {
                    updatedDoc = { $set: { description: req.body.description, updatedAt: Date.now() } };
                }
            } else if (req.body.feedType == 'event') {
                if (req.body.description == null || req.body.description == '') {
                    res.send(utils.errorResponse('Description missing'));
                } else if (req.body.venue == null || req.body.venue == '') {
                    res.send(utils.errorResponse('Venue missing'));
                } else if (req.body.price == null || req.body.price == '') {
                    res.send(utils.errorResponse('Price missing'));
                } else if (req.body.time == null || req.body.time == '') {
                    res.send(utils.errorResponse('Time missing'));
                } else if (req.body.url == null || req.body.url == '') {
                    res.send(utils.errorResponse('Url missing'));
                } else if (req.body.image == null || req.body.image == '') {
                    res.send(utils.errorResponse('Image URL missing'));
                } else {
                    updatedDoc = { $set: { description: req.body.description, venue: req.body.venue, price: req.body.price, time: req.body.time, url: req.body.url, image: req.body.image, updatedAt: Date.now() } };
                }
            } else if (req.body.feedType == 'blog') {
                if (req.body.description == null || req.body.description == '') {
                    res.send(utils.errorResponse('Description missing'));
                } else if (req.body.url == null || req.body.url == '') {
                    res.send(utils.errorResponse('Full URL missing'));
                } else if (req.body.image == null || req.body.image == '') {
                    res.send(utils.errorResponse('Image URL missing'));
                } else {
                    updatedDoc = { $set: {description: req.body.description, url: req.body.url, image: req.body.image, updatedAt: Date.now() } };
                }
            }
            db.collection('feeds').update(details, updatedDoc, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Feed updated successfully', null))
                }
            });
        }
    });

    /* DELETE */
    app.delete('/feed/delete/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('feeds').remove(details, (err, item) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Feed deleted successfully', null))
                }
            });
        }
    });

    /* Read all feeds */
    app.get('/feed/list/:skip', utils.isUserAuthenticated, (req, res) => {
        findCollections(Number(req.params.skip), {}, res)
    });

    /* Feeds from Friends */
    app.get('/feed/friends/:skip', utils.isUserAuthenticated, (req, res) => {
        var cursor = db.collection('friends').findOne({ _id: userId }, (err, item) => {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                if (item.friendList != null && item.friendList.length > 0) {
                    var friendList = []
                    for (var m = 0; m < item.friendList.length; m++) {
                        friendList.push(item.friendList[m]._id)
                    }
                    var query = { $or: [{ userId: { $in: friendList } }, { feedType: 'blog' }, { feedType: 'event' }] }
                    findCollections(Number(req.params.skip), query, res)
                } else {
                    res.send(utils.successResponse("You have no feeds from friends ", friendList))
                }
            }
        });
    });

    /* Find feed by keyword */
    app.get('/feed/search/:keyword', (req, res) => {
        if (req.params.keyword == null || req.params.keyword == '') {
            res.send(utils.errorResponse('Keyword missing'));
        } else {
            findCollections(0, {
                $or: [
                    { description: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } }
                ]
            }, res)
        }
    });

    /* Read My Feeds */
    app.get('/feed/my-feeds', utils.isUserAuthenticated, (req, res) => {
        findCollections(0, { userId: userId }, res)
    });

    /* Read Others Feeds */
    app.get('/feed/other-feeds/:id', utils.isUserAuthenticated, (req, res) => {
        findCollections(0, { userId: req.params.id }, res)
    });

    /* Read single feed */
    app.get('/feed/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            const id = req.params.id;
            findCollections(0, { '_id': new ObjectID(id) }, res)
        }
    });

    /* READ Feed by list of ids */
    app.get('/feed/list-by-id/:feedIds', utils.isUserAuthenticated, (req, res) => {
        if (req.params.feedIds == null || req.params.feedIds.length == 0) {
            res.send(utils.errorResponse("Feed ids missing"))
        } else {
            var feeds = []
            var count = 0
            var feedIds = JSON.parse(req.params.feedIds)
            var feedIdLength = feedIds.length
            for (i = 0; i < feedIdLength; i++) {
                const id = feedIds[i];
                const details = { '_id': new ObjectID(id) };
                db.collection('feeds').findOne(details, (err, item) => {
                    if (err) {
                        count++
                        console.log("error fetching feed : " + err.errmsg)
                    } else if (item == null) {
                        count++
                        console.log("feed not found ")
                    } else {
                        feeds.push(item)
                        count++
                        if (count == feedIdLength)
                            res.send(utils.successResponse('Feeds', feeds))
                    }
                });
            }
        }
    });

    /* Like a Feed */
    app.put('/feed/like/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            const likeObject = { postId: req.params.id, activity: 'like', userId: userId }
            db.collection('activities').insert(likeObject, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse("Feed liked successfully", result.ops[0]))
                    sendNotificationToUser(req.params.id, userName + " " + constants.like, '/home/feed?id=' + req.params.id);
                }
            });
        }
    });

    /* Unlike a Feed */
    app.put('/feed/unlike/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            const details = { postId: req.params.id, activity: 'like', userId: userId };
            db.collection('activities').remove(details, (err, item) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Unliked successfully', null))
                }
            });
        }
    });

    /* Comment on a Feed */
    app.put('/feed/comment/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else if (req.body.newComment == null || req.body.newComment == '') {
            res.send(utils.errorResponse('Comment missing'));
        } else {
            const commentObject = { postId: req.params.id, activity: 'comment', userId: userId, comment: req.body.newComment }
            db.collection('activities').insert(commentObject, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse("Commented successfully on feed", result.ops[0]))
                    sendNotificationToUser(req.params.id, userName + " " + constants.comment, '/home/feed?id=' + req.params.id);
                }
            });
        }
    });

    /* Likes and Comments details on Feed */
    app.get('/feed/details/:id', (req, res) => {
        var combinedResults = {}
        var commentsList = [], likesList = []
        var count = 0, newCount = 0
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            const id = req.params.id;
            var allActivities = []
            const details = { '_id': new ObjectID(id) };
            var commentArrayLength = 0; likesArrayLength = 0
            db.collection('feeds').findOne(details, (err, item) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    /* feed activities details */
                    var query = { postId: item._id.toString() }
                    db.collection('activities').find(query).count(function (err, itemCount) {
                        if (err) {
                            res.send(utils.errorResponse(err.errmsg));
                        } else if (itemCount == 0) {
                            res.send(utils.errorResponse("No posts"));
                        } else {
                            db.collection('activities').find(query).forEach(function (obj) {
                                var idToArray = [], totalCount = 0
                                idToArray.push(obj.userId)
                                async.each(
                                    idToArray,
                                    function (item, completeCallback) {
                                        findOwnerDetails(obj.userId, function (user) {
                                            /* feed owner details */
                                            obj.feedOwner = user
                                            if (obj.activity == 'like') {
                                                var data = {}
                                                data.feedOwner = user
                                                likesList.push(data)
                                            } else if (obj.activity == 'comment') {
                                                var data = {}
                                                data.feedOwner = user
                                                data.comment = obj.comment
                                                commentsList.push(data)
                                            }

                                            newCount++
                                            if (newCount == itemCount) {
                                                var result = {}
                                                result.likesList = likesList
                                                result.commentsList = commentsList
                                                res.send(utils.successResponse(null, result))
                                            }
                                        });
                                    },
                                    console.log("completed")
                                );
                            });
                        }
                    });
                }
            });
        }
    });

    var sendNotificationToUser = function (feedId, content, routeUrl) {
        /* get user id from feed */
        const details = { '_id': new ObjectID(feedId) };
        db.collection('feeds').findOne(details, (function (err, item) {
            if (err) {
                console.log(err.errmsg)
            } else if (item == null) {
                console.log("User not found")
            } else {
                var id = item.userId
                /* get fcm token from user */
                db.collection('users').findOne({ _id: id }, (function (err, item) {
                    if (err) {
                        console.log(err.errmsg)
                    } else if (item == null) {
                        console.log("User not found")
                    } else {
                        var fcmToken = item.fcmToken
                        const notificationService = require('../../services/fcm-notification.js')
                        notificationService.updateNotificationDocument(db, id, fcmToken, content, routeUrl)
                    }
                }));
            }
        }));
    }

    var findCollections = function (skipParam, query, res) {
        var newCount = 0, limitCount;
        limitCount = Number(5);
        skipCount = skipParam * limitCount

        db.collection('feeds').find(query).limit(limitCount).skip(skipCount).count(function (err, itemCount) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else if (itemCount == 0) {
                res.send(utils.errorResponse("No posts"));
            } else {
                var allPost = [], likesCount = 0, commentsCount = 0
                db.collection('feeds').find(query).sort( { createdAt : -1 } ).limit(limitCount).skip(skipCount).forEach(function (obj) {
                    var idToArray = [], totalCount = 0
                    idToArray.push(obj.userId)
                    async.each(
                        idToArray,
                        function (item, completeCallback) {
                            findOwnerDetails(obj.userId, function (user) {
                                /* feed owner details */
                                obj.feedOwner = user

                                /* feed activities details */
                                var cursor = db.collection('activities').find({ postId: obj._id.toString() });
                                cursor.toArray(function (err, docs) {
                                    if (err) {
                                        res.send(utils.errorResponse(err.errmsg));
                                    } else {
                                        for (var i = 0; i < docs.length; i++) {
                                            if (docs[i].activity == 'like') {
                                                ++likesCount
                                                /* User has liked post*/
                                                if (docs[i].userId == userId) {
                                                    obj.hasLiked = true
                                                }
                                            } else if (docs[i].activity == 'comment') {
                                                ++commentsCount
                                            }
                                        }
                                    }
                                    /* push details and increment*/
                                    obj.likesCount = likesCount
                                    obj.commentsCount = commentsCount
                                    allPost.push(obj)
                                    newCount++
                                    if (newCount == itemCount) {
                                        res.send(utils.successResponse(null, allPost))
                                    }
                                });
                            });
                        }
                    );
                });
            }
        });
    }

    var findOwnerDetails = function (userId, callback) {
        if (userId != null) {
            db.collection('users').findOne({ _id: userId }, (function (err, item) {
                if (err) {
                    callback(null)
                } else if (item == null) {
                    callback(item)
                } else {
                    var feedSection = {}
                    feedSection.name = item.name
                    feedSection.userId = item._id
                    feedSection.image = item.image
                    callback(feedSection)
                }
            }));
        } else {
            callback(null)
        }
    }
}