const utils = require('../../utils/utils.js')

module.exports = function (app, db) {
    utils.setdatabase(db)
    var ObjectID = require('mongodb').ObjectID;

    /* CREATE */
    app.post('/event/add', utils.isAdminAuthenticated, (req, res) => {
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
            const event = { title: req.body.title, description: req.body.description, venue: req.body.venue, price: req.body.price, time: req.body.time, url: req.body.url, image: req.body.image, createdAt: Date.now()};
            db.collection('events').insert(event, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse(null, result.ops[0]))
                }
            });
        }
    });

    /* UPDATE */
    app.put('/event/update/:id', utils.isAdminAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Event id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            const event = { $set: { title: req.body.title, description: req.body.description, venue: req.body.venue, price: req.body.price, time: req.body.time, url: req.body.url, image: req.body.image, updatedAt: Date.now() } };
            db.collection('events').update(details, event, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Event updated successfully', null))
                }
            });
        }
    });

    /* DELETE */
    app.delete('/event/delete/:id', utils.isAdminAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Event id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('events').remove(details, (err, item) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Event deleted successfully', null))
                }
            });
        }
    });

    /* Find events by keyword */
    app.get('/event/search/:keyword', (req, res) => {
        if (req.params.keyword == null || req.params.keyword == '') {
            res.send(utils.errorResponse('Keyword missing'));
        } else {
            var cursor = db.collection('events').find({
                $or: [
                    { title: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } },
                    { description: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } }
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
    app.get('/event/list', utils.isUserAuthenticated, (req, res) => {
        var cursor = db.collection('events').find({});
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(utils.errorResponse(err.errmsg));
            } else {
                var eventsLength = docs.length
                if (eventsLength > 0) {
                    for (i = 0; i < eventsLength; i++) {
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

    /* Like a event */
    app.put('/event/like/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Event id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('events').update(details, { "$push": { likes: userId } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Event liked successfully', null))
                }
            });
        }
    });

    /* Dislike a event */
    app.put('/event/unlike/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Event id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('events').update(details, { "$pull": { likes: userId } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Event like removed successfully', null))
                }
            });
        }
    });

    /* Comment on a Event */
    app.put('/event/comment/:id', utils.isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(utils.errorResponse('Event id missing'));
        } else if (req.body.newComment == null || req.body.newComment == '') {
            res.send(utils.errorResponse('Comment missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('events').update(details, { "$push" : { comments : { userId : userId, comment : req.body.newComment } } }, (err, result) => {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse('Commented successfully on event', null))
                }
            });
        }
    });

    /* READ a single event */
    // app.get('/event/:id', (req, res) => {
    //     if (req.params.id == null) {
    //         res.send(utils.errorResponse('Event id missing'));
    //     } else {
    //         const id = req.params.id;
    //         const details = { '_id': new ObjectID(id) };
    //         db.collection('events').findOne(details, (err, item) => {
    //             if (err) {
    //                 res.send(utils.errorResponse(err.errmsg));
    //             } else {
    //                 res.send(utils.successResponse(null, item))
    //             }
    //         });
    //     }
    // });
};