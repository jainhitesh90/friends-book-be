const utils = require('../../utils/utils.js')
const constants = require('../../utils/constants.js')
var multer = require('multer')
var upload = multer({ dest: 'uploads/' })

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

    /* Find feed by keyword */
    app.get('/feed/search/:keyword', (req, res) => {
        if (req.params.keyword == null || req.params.keyword == '') {
            res.send(utils.errorResponse('Keyword missing'));
        } else {
            var cursor = db.collection('feeds').find({
                $or: [
                    { description: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } },
                    { title: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } },
                    { description: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } }
                ]
            });
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else if (docs.length == 0) {
                    res.send(utils.errorResponse("No results found"));
                } else {
                    var count = 0
                    var feedsLength = docs.length
                    if (feedsLength > 0) {
                        for (i = 0; i < feedsLength; i++) {
                            /* Feed owner details */
                            if (docs[i].userId != null) {
                                db.collection('users').aggregate([{
                                    $lookup: {
                                        from: docs[i].userId.toString(), localField: "_id", foreignField: "userId", as: "feed_owner"
                                    }
                                }], function (err, results) {
                                    if (err) {
                                        res.send(utils.errorResponse(err.errmsg));
                                    } else {
                                        var feedSection = {}
                                        feedSection.name = results[0].name
                                        feedSection.userId = results[0]._id
                                        feedSection.image = results[0].image
                                        docs[count].feedOwner = feedSection
                                        count++
                                        if (count == feedsLength)
                                            res.send(utils.successResponse(null, docs))
                                    }
                                });
                            } else {
                                count++
                                if (count == feedsLength)
                                    res.send(utils.successResponse(null, docs))
                            }
                        }
                    }
                }
            });
        }
    });

    /* READ ALL */
    app.get('/feed/list', utils.isUserAuthenticated, (req, res) => {
        var count = 0;
        var cursor = db.collection('feeds').find();
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var feedsLength = docs.length
                if (feedsLength > 0) {
                    for (i = 0; i < feedsLength; i++) {
                        /* Feed owner details */
                        if (docs[i].userId != null) {
                            db.collection('users').findOne({ _id: Number(docs[i].userId) }, (function (err, item) {
                                if (err) {
                                    res.send(utils.errorResponse(err.errmsg));
                                } else {
                                    var feedSection = {}
                                    feedSection.name = item.name
                                    feedSection.userId = item._id
                                    feedSection.image = item.image
                                    docs[count].feedOwner = feedSection

                                    /* Coutng total likes */
                                    docs[count].likesCount = 0
                                    if (docs[count].likes != null && docs[count].likes.length > 0) {
                                        docs[count].likesCount = docs[count].likes.length
                                        if (docs[count].likes.indexOf(userId) != -1) {
                                            docs[count].hasLiked = true
                                        }
                                    }
                                    /* Coutng total comments */
                                    docs[count].commentsCount = 0
                                    if (docs[count].comments != null && docs[count].comments.length > 0) {
                                        docs[count].commentsCount = docs[count].comments.length
                                    }

                                    count++
                                    if (count == feedsLength)
                                        res.send(utils.successResponse(null, docs))
                                }
                            }));
                        } else {
                            count++
                            if (count == feedsLength)
                                res.send(utils.successResponse(null, docs))
                        }
                    }
                } else {
                    res.send(utils.successResponse(null, docs))
                }
            }
        });
    });

    /* Feeds from Friends */
    app.get('/feed/friends', utils.isUserAuthenticated, (req, res) => {
        var cursor = db.collection('friends').findOne({ _id: userId }, (err, item) => {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                if (item.friendList != null && item.friendList.length > 0) {
                    var count = 0;
                    var friendList = []
                    for (var m = 0; m < item.friendList.length; m++) {
                        friendList.push(item.friendList[m]._id)
                    }
                    var cursor = db.collection('feeds').find( { 
                        userId : { $in : friendList } 
                    });

                    //db.inventory.find( { userId: { $in: item.friendList} } )
                    cursor.toArray(function (err, docs) {
                        if (err) {
                            res.send(utils.errorResponse(err.errmsg));
                        } else {
                            var feedsLength = docs.length
                            if (feedsLength > 0) {
                                for (i = 0; i < feedsLength; i++) {
                                    /* Feed owner details */
                                    if (docs[i].userId != null) {
                                        db.collection('users').findOne({ _id: Number(docs[i].userId) }, (function (err, item) {
                                            if (err) {
                                                res.send(utils.errorResponse(err.errmsg));
                                            } else {
                                                var feedSection = {}
                                                feedSection.name = item.name
                                                feedSection.userId = item._id
                                                feedSection.image = item.image
                                                docs[count].feedOwner = feedSection

                                                /* Coutng total likes */
                                                docs[count].likesCount = 0
                                                if (docs[count].likes != null && docs[count].likes.length > 0) {
                                                    docs[count].likesCount = docs[count].likes.length
                                                    if (docs[count].likes.indexOf(userId) != -1) {
                                                        docs[count].hasLiked = true
                                                    }
                                                }
                                                /* Coutng total comments */
                                                docs[count].commentsCount = 0
                                                if (docs[count].comments != null && docs[count].comments.length > 0) {
                                                    docs[count].commentsCount = docs[count].comments.length
                                                }

                                                count++
                                                if (count == feedsLength)
                                                    res.send(utils.successResponse(null, docs))
                                            }
                                        }));
                                    } else {
                                        count++
                                        if (count == feedsLength)
                                            res.send(utils.successResponse(null, docs))
                                    }
                                }
                            } else {
                                res.send(utils.successResponse(null, docs))
                            }
                        }
                    });
                } else {
                    res.send(utils.successResponse("You have no feeds from friends ", friendList))
                }
            }
        });
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
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('feeds').update(details, { "$push": { likes: userId } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    sendNotificationToUser(req.params.id, userName + " " + constants.like, 'http://localhost:3000/home/feed?id=' + req.params.id);
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
                    sendNotificationToUser(req.params.id, userName + " " + constants.comment, 'http://localhost:3000/home/feed?id=' + req.params.id);
                    res.send(utils.successResponse('Commented successfully on feed', result))
                }
            });
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
            db.collection('feeds').findOne(details, (err, item) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    var count1 = 0, count2 = 0
                    var commentArrayLength = item['comments'].length
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

                    var likesArrayLength = item['likes'].length
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
            });
        }
    });

    /* Read My Feeds */
    app.get('/feed/my-feeds', utils.isUserAuthenticated, (req, res) => {
        var cursor = db.collection('feeds').find({ userId: userId });
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var feedsLength = docs.length
                if (feedsLength > 0) {
                    for (i = 0; i < feedsLength; i++) {
                        /* Coutng total likes */
                        docs[i].likesCount = 0
                        if (docs[i].likes != null && docs[i].likes.length > 0) {
                            docs[i].likesCount = docs[i].likes.length
                            if (docs[i].likes.indexOf(userId) != -1) {
                                docs[i].hasLiked = true
                            }
                        }
                        /* Coutng total comments */
                        docs[i].commentsCount = 0
                        if (docs[i].comments != null && docs[i].comments.length > 0) {
                            docs[i].commentsCount = docs[i].comments.length
                        }
                    }
                }
                res.send(utils.successResponse(null, docs))
            }
        });
    });

    /* Read Others Feeds */
    app.get('/feed/other-feeds/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            var cursor = db.collection('feeds').find({ userId: Number(req.params.id) });
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    var feedsLength = docs.length
                    if (feedsLength > 0) {
                        for (i = 0; i < feedsLength; i++) {
                            /* Coutng total likes */
                            docs[i].likesCount = 0
                            if (docs[i].likes != null && docs[i].likes.length > 0) {
                                docs[i].likesCount = docs[i].likes.length
                                if (docs[i].likes.indexOf(userId) != -1) {
                                    docs[i].hasLiked = true
                                }
                            }
                            /* Coutng total comments */
                            docs[i].commentsCount = 0
                            if (docs[i].comments != null && docs[i].comments.length > 0) {
                                docs[i].commentsCount = docs[i].comments.length
                            }
                        }
                    }
                    res.send(utils.successResponse(null, docs))
                }
            });
        }
    });

    /* READ */
    app.get('/feed/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Feed id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('feeds').findOne(details, (err, item) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else if (item == null) {
                    res.send(utils.successResponse(null, item))
                } else {
                    /* Feed owner details */
                    if (item.userId != null) {
                        db.collection('users').aggregate([{
                            $lookup: {
                                from: item.userId.toString(), localField: "_id", foreignField: "userId", as: "feed_owner"
                            }
                        }], function (err, results) {
                            if (err) {
                                res.send(utils.errorResponse(err.errmsg));
                            } else {
                                var feedSection = {}
                                feedSection.name = results[0].name
                                feedSection.userId = results[0]._id
                                feedSection.image = results[0].image
                                item.feedOwner = feedSection

                                /* Coutng total likes */
                                item.likesCount = 0
                                if (item.likes != null && item.likes.length > 0) {
                                    item.likesCount = item.likes.length
                                    if (item.likes.indexOf(userId) != -1) {
                                        item.hasLiked = true
                                    }
                                }
                                /* Coutng total comments */
                                item.commentsCount = 0
                                if (item.comments != null && item.comments.length > 0) {
                                    item.commentsCount = item.comments.length
                                }
                                res.send(utils.successResponse(null, item))
                            }
                        });
                    } else {
                        res.send(utils.successResponse(null, item))
                    }
                }
            });
        }
    });

    var sendNotificationToUser = function (feedId, content, redirectUrl) {
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
                        notificationService.updateNotificationDocument(db, id, fcmToken, content, redirectUrl)
                    }
                }));
            }
        }));
    }
}