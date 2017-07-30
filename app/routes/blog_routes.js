const utils = require('../../utils/utils.js')

module.exports = function (app, db) {
    utils.setdatabase(db)
    var ObjectID = require('mongodb').ObjectID;

    /* CREATE */
    app.post('/blog/add', utils.isAdminAuthenticated, (req, res) => {
        if (req.body.title == null || req.body.title == '') {
            res.send(utils.errorResponse('Title missing'));
        } else if (req.body.description == null || req.body.description == '') {
            res.send(utils.errorResponse('Description missing'));
        } else if (req.body.fullUrl == null || req.body.fullUrl == '') {
            res.send(utils.errorResponse('Full URL missing'));
        } else if (req.body.image == null || req.body.image == '') {
            res.send(utils.errorResponse('Image URL missing'));
        } else {
            const blog = { title: req.body.title, description: req.body.description, fullUrl: req.body.fullUrl, image: req.body.image, createdAt: Date.now() };
            db.collection('blogs').insert(blog, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse(null, result.ops[0]))
                }
            });
        }
    });

    /* UPDATE */
    app.put('/blog/update/:id', utils.isAdminAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Blog id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            const blog = { $set: { title: req.body.title, description: req.body.description, fullUrl: req.body.fullUrl, image: req.body.image, updatedAt: Date.now() } };
            db.collection('blogs').update(details, blog, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Blog updated successfully', null))
                }
            });
        }
    });

    /* DELETE */
    app.delete('/blog/delete/:id', utils.isAdminAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Blog id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('blogs').remove(details, (err, item) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Blog deleted successfully', null))
                }
            });
        }

    });

    /* Find blogs by keyword */
    app.get('/blog/search/:keyword', (req, res) => {
        if (req.params.keyword == null || req.params.keyword == '') {
            res.send(utils.errorResponse('Keyword missing'));
        } else {
            var cursor = db.collection('blogs').find({
                $or: [
                    { title: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } },
                    { description: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } }
                ]
                //title : {$regex : ".*" + req.params.keyword + ".*", '$options' : 'i'}
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
    app.get('/blog/list', utils.isUserAuthenticated,(req, res) => {
        var cursor = db.collection('blogs').find({});
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var blogsLength = docs.length
                if (blogsLength > 0) {
                    for (i = 0; i < blogsLength; i++) {
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

    /* Like a blog */
    app.put('/blog/like/:id', utils.isUserAuthenticated, (req, res) => {
        console.log("blog user id normal : " + userId)
        if (req.params.id == null) {
            res.send(utils.errorResponse('Blog id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('blogs').update(details, { "$push": { likes: userId } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Blog liked successfully', null))
                }
            });
        }
    });

    /* Dislike a blog */
    app.put('/blog/unlike/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Blog id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('blogs').update(details, { "$pull": { likes: userId } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Blog like removed successfully', null))
                }
            });
        }
    });

    /* Comment on a blog */
    app.put('/blog/comment/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Blog id missing'));
        } else if (req.body.newComment == null || req.body.newComment == '') {
            res.send(utils.errorResponse('Comment missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('blogs').update(details, { "$push" : { comments : { userId : userId, comment : req.body.newComment } } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Commented successfully', null))
                }
            });
        }
    });

    /* Likes and Comments on blog */
    app.get('/blog/details/:id', (req, res) => {
        var combinedResults = {}
        var commentsList = [], likesList = [], commentText = []
        var count = 0
        if (req.params.id == null) {
            res.send(utils.errorResponse('Blog id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('blogs').findOne(details, (err, item) => {
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

    /* READ */
    // app.get('/blog/:id', isUserAuthenticated, (req, res) => {
    //     if (req.params.id == null) {
    //         res.send(utils.errorResponse('Blog id missing'));
    //     } else {
    //         const id = req.params.id;
    //         const details = { '_id': new ObjectID(id) };
    //         db.collection('blogs').findOne(details, (err, item) => {
    //             if (err) {
    //                 res.send(utils.errorResponse(err.errmsg));
    //             } else if (item != null) {
    //                 item.likesCount = 0 //initializing
    //                 if (item.likes != null && item.likes.length > 0) {
    //                     item.likesCount = item.likes.length
    //                     if (item.likes.indexOf(userId) != -1) {
    //                         item.hasLiked = true
    //                     }
    //                 }
    //                 res.send(utils.successResponse(null, item))
    //             } else {
    //                 res.send(utils.errorResponse("Item not found"));
    //             }
    //         });
    //     }
    // });
};