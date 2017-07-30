const utils = require('../../utils/utils.js')
const constants = require('../../utils/constants.js')
var multer = require('multer')
var upload = multer({ dest: 'uploads/' })

module.exports = function (app, db) {
    utils.setdatabase(db)
    var ObjectID = require('mongodb').ObjectID;

    /* CREATE */
    app.post('/post/add', [utils.isUserAuthenticated, upload.single('content')], (req, res) => {
        var AWS = require('aws-sdk');
        AWS.config.loadFromPath('./config/aws-config.json');
        const configFile = require('../../config/credentials');
        var s3Bucket = new AWS.S3({ params: { Bucket: configFile.s3BucketName } })
        var fs = require('fs');
        var file = req.file;
        if (req.body.contentDescription == null || req.body.contentDescription == '') {
            res.send(utils.errorResponse('Please add some description'))
        } else if (file == null || file.path == null) {
            res.send(utils.errorResponse('File missing'))
        } else {
            fs.readFile(file.path, function (err, data) {
                if (err) throw err; // Something went wrong!
                s3Bucket.createBucket(function () {
                    var params = { Key: file.filename, Body: data, ContentType: 'image/png', ACL: 'public-read' };
                    s3Bucket.upload(params, function (err, data) {
                        fs.unlink(file.path, function (err) {
                            if (err) { console.error(err); }
                        });
                        if (err) {
                            res.send(utils.errorResponse('Something went wrong!!'))
                        } else {
                            const post = { userId: userId, contentDescription: req.body.contentDescription, contentUrl: data['Location'], createdAt: Date.now() };
                            db.collection('posts').insert(post, (err, result) => {
                                if (err) {
                                    res.send(utils.errorResponse(err.errmsg));
                                } else {
                                    res.send(utils.successResponse("Posted successfully", result.ops[0]))
                                }
                            });
                        }
                    });
                });
            });
        }
    });

    /* UPDATE */
    app.put('/post/update/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Post id missing'));
        } else if (req.body.contentDescription == null || req.body.contentDescription == '') {
            res.send(utils.errorResponse('Please add some description'))
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            const post = { $set: { contentDescription: req.body.contentDescription, updatedAt: Date.now() } };
            db.collection('posts').update(details, post, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Post updated successfully', null))
                }
            });
        }
    });

    /* DELETE */
    app.delete('/post/delete/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Post id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('posts').remove(details, (err, item) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Post deleted successfully', null))
                }
            });
        }

    });

    /* Find post by keyword */
    app.get('/posts/search/:keyword', (req, res) => {
        if (req.params.keyword == null || req.params.keyword == '') {
            res.send(utils.errorResponse('Keyword missing'));
        } else {
            var cursor = db.collection('posts').find({
                $or: [
                    { contentDescription: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } }
                ]
            });
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse(null, docs))
                }
            });
        }
    });

    /* READ ALL */
    app.get('/post/list', utils.isUserAuthenticated, (req, res) => {
        var count = 0;
        var cursor = db.collection('posts').find({});
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var postsLength = docs.length
                if (postsLength > 0) {
                    for (i = 0; i < postsLength; i++) {
                        /* Post owner details */
                        db.collection('users').aggregate([{
                            $lookup: {
                                from: docs[i].userId.toString(), localField: "_id", foreignField: "userId", as: "post_owner"
                            }
                        }], function (err, results) {
                            if (err) {
                                res.send(utils.errorResponse(err.errmsg));
                            } else {
                                var postSection = {}
                                postSection.name = results[0].name
                                postSection.image = results[0].image
                                docs[count].postOwner = postSection

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

                                if (count == postsLength)
                                    res.send(utils.successResponse(null, docs))
                            }
                        });
                    }
                }
                
            }
        });
    });

    /* Like a Post */
    app.put('/post/like/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Post id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('posts').update(details, { "$push": { likes: userId } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    updateNotifications(req.params.id, userId, constants.like)
                    res.send(utils.successResponse('Post liked successfully', result))
                }
            });
        }
    });

    /* Unlike a Post */
    app.put('/post/unlike/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Post id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('posts').update(details, { "$pull": { likes: userId } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    updateNotifications(req.params.id, userId, constants.unlike)
                    res.send(utils.successResponse('Post like removed successfully', result))
                }
            });
        }
    });

    /* Comment on a Post */
    app.put('/post/comment/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Post id missing'));
        } else if (req.body.newComment == null || req.body.newComment == '') {
            res.send(utils.errorResponse('Comment missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('posts').update(details, { "$push": { comments: { userId: userId, comment: req.body.newComment } } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    updateNotifications(req.params.id, userId, constants.comment)
                    res.send(utils.successResponse('Commented successfully on post', result))
                }
            });
        }
    });

    /* Likes and Comments on post */
    app.get('/post/details/:id', (req, res) => {
        var combinedResults = {}
        var commentsList = [], likesList = [], commentText = []
        var count = 0
        if (req.params.id == null) {
            res.send(utils.errorResponse('Post id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('posts').findOne(details, (err, item) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    var commentArrayLength = item['comments'].length
                    for (i = 0; i < commentArrayLength; i++) {
                        commentText.push(item['comments'][i].comment)
                        db.collection('users').aggregate([{
                            $lookup: {
                                from: item['comments'][i].userId.toString(), localField: "_id", foreignField: "userId", as: "post_comments"
                            }
                        }], function (err, results) {
                            if (err) {
                                res.send(utils.errorResponse(err.errmsg));
                            } else {
                                var commentSection = {}
                                commentSection.name = results[0].name
                                commentSection.image = results[0].image
                                commentSection.content = commentText[count]
                                commentsList.push(commentSection);
                                count++
                                if (likesList.length == likesArrayLength && commentsList.length == commentArrayLength) {
                                    combinedResults.commentsList = commentsList
                                    combinedResults.likesList = likesList
                                    res.send(utils.successResponse("yo", combinedResults))
                                }
                            }
                        });
                    }

                    var likesArrayLength = item['likes'].length
                    for (i = 0; i < likesArrayLength; i++) {
                        db.collection('users').aggregate([{
                            $lookup: {
                                from: item['likes'][i].toString(), localField: "_id", foreignField: "id", as: "post_likes"
                            }
                        }], function (err, results) {
                            if (err) {
                                res.send(utils.errorResponse(err.errmsg));
                            } else {
                                var likeSection = {}
                                likeSection.name = results[0].name
                                likeSection.image = results[0].image
                                likesList.push(likeSection);
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

    /* Read My Posts */
    app.get('/post/my-posts', utils.isUserAuthenticated, (req, res) => {
        var cursor = db.collection('posts').find({ userId: userId });
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var postsLength = docs.length
                if (postsLength > 0) {
                    for (i = 0; i < postsLength; i++) {
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

    /* READ */
    app.get('/post/:id', (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Post id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('posts').findOne(details, (err, item) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse(null, item))
                }
            });
        }
    });

    var updateNotifications = function (postId, userId, activity) {
        console.log("searching post wid post id : " + postId)
        const details = { '_id': new ObjectID(postId) };
        db.collection('posts').findOne(details, (err, item) => {
            if (err) {
                console.log("error fetching post details")
            } else if (item != null && item.userId != null) {
                var postOwnerId = item.userId
                console.log("postOwnerId : " + postOwnerId)
                switch (activity) {
                    case constants.like:
                        const notificationLike = { postId: postId, postOwnerId: postOwnerId, userId: userId, activity: activity, createdAt: Date.now() };
                        db.collection('notifications').insert(notificationLike, (err, result) => {
                            if (err) {
                                console.log("error : " + err.errmsg)
                            } else {
                                sendNotificationToUser(postOwnerId, userId, "liked your post")
                                console.log("User with id " + userId + " liked your post with id " + postId)
                            }
                        });
                        break;
                    case constants.unlike:
                        const notificationUnlike = { postId: postId, postOwnerId: postOwnerId, userId: userId, activity: constants.like };
                        db.collection('notifications').remove(notificationUnlike, (err, item) => {
                            if (err) {
                                console.log("error : " + err.errmsg)
                            } else {
                                console.log("User with id " + userId + " unliked your post with id " + postId)
                            }
                        });
                        break;
                    case constants.comment:
                        const notificationComment = { postId: postId, postOwnerId: postOwnerId, userId: userId, activity: activity, createdAt: Date.now() };
                        db.collection('notifications').insert(notificationComment, (err, result) => {
                            if (err) {
                                console.log("error : " + err.errmsg)
                            } else {
                                sendNotificationToUser(postOwnerId, userId, "commented on your post")
                                console.log("User with id " + userId + " commented on your post with id " + postId)
                            }
                        });
                        break;
                    default:
                        console.log("Something went wrong")
                }
            }
        });
    }

    var sendNotificationToUser = function (postOwnerId, userId, message) {
        console.log("Notification sent to " + postOwnerId + ", user with userid " + userId + " and message " + message)
    }
}