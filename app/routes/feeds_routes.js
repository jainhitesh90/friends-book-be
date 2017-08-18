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
        if (req.body.feedType == 'event') {
            if (req.body.title == null || req.body.title == '') {
                res.send(utils.errorResponse('Title missing'));
            } else if (req.body.description == null || req.body.description == '') {
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
                const event = { feedType: req.body.feedType, title: req.body.title, description: req.body.description, venue: req.body.venue, price: req.body.price, time: req.body.time, url: req.body.url, image: req.body.image, createdAt: Date.now() };
                db.collection('feeds').insert(event, (err, result) => {
                    if (err) {
                        res.send(utils.errorResponse(err.errmsg));
                    } else {
                        res.send(utils.successResponse(null, result.ops[0]))
                    }
                });
            }
        } else if (req.body.feedType == 'blog') {
            if (req.body.title == null || req.body.title == '') {
                res.send(utils.errorResponse('Title missing'));
            } else if (req.body.description == null || req.body.description == '') {
                res.send(utils.errorResponse('Description missing'));
            } else if (req.body.url == null || req.body.url == '') {
                res.send(utils.errorResponse('Full URL missing'));
            } else if (req.body.image == null || req.body.image == '') {
                res.send(utils.errorResponse('Image URL missing'));
            } else {
                const blog = { feedType: req.body.feedType, title: req.body.title, description: req.body.description, url: req.body.url, image: req.body.image, createdAt: Date.now() };
                db.collection('feeds').insert(blog, (err, result) => {
                    if (err) {
                        res.send(utils.errorResponse(err.errmsg));
                    } else {
                        res.send(utils.successResponse(null, result.ops[0]))
                    }
                });
            }
        } else {
            res.send(utils.errorResponse("Feed type invalid"));
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
            if (req.body.title == null || req.body.title == '') {
                res.send(utils.errorResponse('Describe your feed'))
            } else if (file == null || file.path == null) {
                const feed = { feedType: req.body.feedType, userId: userId, title: req.body.title, createdAt: Date.now() };
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
        } else if (req.body.feedType == 'event') {
            if (req.body.title == null || req.body.title == '') {
                res.send(utils.errorResponse('Title missing'));
            } else if (req.body.description == null || req.body.description == '') {
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
                const event = { feedType: req.body.feedType, userId: userId, title: req.body.title, description: req.body.description, venue: req.body.venue, price: req.body.price, time: req.body.time, url: req.body.url, image: req.body.image, createdAt: Date.now() };
                db.collection('feeds').insert(event, (err, result) => {
                    if (err) {
                        res.send(utils.errorResponse(err.errmsg));
                    } else {
                        res.send(utils.successResponse(null, result.ops[0]))
                    }
                });
            }
        } else if (req.body.feedType == 'blog') {
            if (req.body.title == null || req.body.title == '') {
                res.send(utils.errorResponse('Title missing'));
            } else if (req.body.description == null || req.body.description == '') {
                res.send(utils.errorResponse('Description missing'));
            } else if (req.body.url == null || req.body.url == '') {
                res.send(utils.errorResponse('Full URL missing'));
            } else if (req.body.image == null || req.body.image == '') {
                res.send(utils.errorResponse('Image URL missing'));
            } else {
                const blog = { feedType: req.body.feedType, userId: userId, title: req.body.title, description: req.body.description, url: req.body.url, image: req.body.image, createdAt: Date.now() };
                db.collection('feeds').insert(blog, (err, result) => {
                    if (err) {
                        res.send(utils.errorResponse(err.errmsg));
                    } else {
                        res.send(utils.successResponse(null, result.ops[0]))
                    }
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
                if (req.body.title == null || req.body.title == '') {
                    res.send(utils.errorResponse('Title missing'));
                } else if (req.body.description == null || req.body.description == '') {
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
                    updatedDoc = { $set: { title: req.body.title, description: req.body.description, venue: req.body.venue, price: req.body.price, time: req.body.time, url: req.body.url, image: req.body.image, updatedAt: Date.now() } };
                }
            } else if (req.body.feedType == 'blog') {
                if (req.body.title == null || req.body.title == '') {
                    res.send(utils.errorResponse('Title missing'));
                } else if (req.body.description == null || req.body.description == '') {
                    res.send(utils.errorResponse('Description missing'));
                } else if (req.body.url == null || req.body.url == '') {
                    res.send(utils.errorResponse('Full URL missing'));
                } else if (req.body.image == null || req.body.image == '') {
                    res.send(utils.errorResponse('Image URL missing'));
                } else {
                    updatedDoc = { $set: { title: req.body.title, description: req.body.description, url: req.body.url, image: req.body.image, updatedAt: Date.now() } };
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
        findCollections(Number(req.params.skip),{}, res)
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
                    var query = { $or: [ { userId : { $in : friendList }}, { feedType : 'blog' }, { feedType : 'event' } ] }
                    findCollections(Number(req.params.skip),query, res)
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
                    { description: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } },
                    { title: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } },
                    { description: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } }
                ]
            } , res)
        }
    });

    /* Read My Feeds */
    app.get('/feed/my-feeds', utils.isUserAuthenticated, (req, res) => {
        findCollections(0, { userId: userId } , res)
    });

    /* Read Others Feeds */
    app.get('/feed/other-feeds/:id', utils.isUserAuthenticated, (req, res) => {
        findCollections(0, { userId: Number(req.params.id) } , res)
    });

    /* Read single feed */
    app.get('/feed/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            const id = req.params.id;
            findCollections(0, { '_id': new ObjectID(id) } , res)
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

    /* Likes and Comments on Feed */
    app.get('/feed/details/:id', (req, res) => {
        var combinedResults = {}
        var commentsList = [], likesList = [], commentText = []
        var count = 0
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            var commentArrayLength = 0; likesArrayLength = 0
            db.collection('feeds').findOne(details, (err, item) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    var count1 = 0, count2 = 0
                    if (item['likes'] == null && item['comments'] == null)
                        res.send(utils.successResponse(null, combinedResults))
                    else {
                        if (item['likes'] != null)
                            likesArrayLength = item['likes'].length
                        if (item['comments'] != null) 
                            commentArrayLength = item['comments'].length
                        if (item['likes'] != null) {
                            for (i = 0; i < likesArrayLength; i++) {
                                db.collection('users').aggregate([{
                                    $lookup: {
                                        from: item['likes'][i].toString(), localField: "_id", foreignField: "id", as: "feed_likes"
                                    }
                                }], function (err, results) {
                                    if (err) {
                                        res.send(utils.errorResponse(err.errmsg));
                                    } else {
                                        var likeSection = {}
                                        likeSection.name = results[count2].name
                                        likeSection.image = results[count2].image
                                        likesList.push(likeSection);
                                        count2++
                                        if (likesList.length == likesArrayLength && commentsList.length == commentArrayLength) {
                                            combinedResults.commentsList = commentsList
                                            combinedResults.likesList = likesList
                                            res.send(utils.successResponse("yo", combinedResults))
                                        }
                                    }
                                });
                            }
                        }
                        if (item['comments'] != null) {
                            if (commentArrayLength == 0) {
                                if (likesList.length == likesArrayLength) {
                                    combinedResults.likesList = likesList
                                    res.send(utils.successResponse(null, combinedResults))
                                }
                            } else {
                                for (i = 0; i < commentArrayLength; i++) {
                                    commentText.push(item['comments'][i].comment)
                                    db.collection('users').aggregate([{
                                        $lookup: {
                                            from: item['comments'][i].userId.toString(), localField: "_id", foreignField: "userId", as: "feed_comments"
                                        }
                                    }], function (err, results) {
                                        if (err) {
                                            res.send(utils.errorResponse(err.errmsg));
                                        } else {
                                            var commentSection = {}
                                            commentSection.name = results[count1].name
                                            commentSection.image = results[count1].image
                                            commentSection.content = commentText[count1]
                                            commentsList.push(commentSection);
                                            count1++
                                            if (likesList.length == likesArrayLength && commentsList.length == commentArrayLength) {
                                                combinedResults.commentsList = commentsList
                                                combinedResults.likesList = likesList
                                                res.send(utils.successResponse(null, combinedResults))
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            });
        }
    });

    /* Like a Feed */
    app.put('/feed/like/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('feeds').update(details, { "$push": { likes: userId } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    sendNotificationToUser(req.params.id, userName + " " + constants.like, '/home/feed?id=' + req.params.id);
                    res.send(utils.successResponse('Feed liked successfully', result))
                }
            });
        }
    });

    /* Unlike a Feed */
    app.put('/feed/unlike/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('feeds').update(details, { "$pull": { likes: userId } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Feed like removed successfully', result))
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
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('feeds').update(details, { "$push": { comments: { userId: userId, comment: req.body.newComment } } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    sendNotificationToUser(req.params.id, userName + " " + constants.comment, '/home/feed?id=' + req.params.id);
                    res.send(utils.successResponse('Commented successfully on feed', result))
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

    var findCollections = function(skipParam, query, res) {
        var newCount = 0, limitCount;
        if (skipParam == 0) {
            skipCount = 0
            limitCount = Number(100)
        } else {
            limitCount = Number(5);
            skipCount = skipParam * limitCount
        }

        console.log(" 1 query : " + query)
        
        db.collection('feeds').find(query).limit(limitCount).skip(skipCount).count(function (err, itemCount)  {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else if (itemCount == 0) {
                res.send(utils.errorResponse("No posts"));
            } else {
                var allPost = []
                db.collection('feeds').find(query).limit(limitCount).skip(skipCount).forEach(function(obj){ 
                    var idToArray = [], totalCount = 0
                    idToArray.push(obj.userId)
                    async.each(
                        idToArray, 
                        function(item, completeCallback) {
                            findOwnerDetails(obj.userId, function (user) {
                                /* feed owner details */
                                obj.feedOwner = user
                                /* Coutng total likes */
                                obj.likesCount = 0
                                if (obj.likes != null && obj.likes.length > 0) {
                                    obj.likesCount = obj.likes.length
                                    if (obj.likes.indexOf(userId) != -1) {
                                        obj.hasLiked = true
                                    }
                                }
                                /* Coutng total comments */
                                obj.commentsCount = 0
                                if (obj.comments != null && obj.comments.length > 0) {
                                    obj.commentsCount = obj.comments.length
                                }
                                /* push details and increment*/
                                allPost.push(obj)
                                newCount++
                                if (newCount == itemCount)
                                    res.send(utils.successResponse(null, allPost))
                            });
                        },
                        console.log("completed")
                    );
                });
            }
        });
    }

    var findOwnerDetails = function (userId, callback) {
        if (userId != null) {
            db.collection('users').findOne({ _id : userId}, (function (err, item) {
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