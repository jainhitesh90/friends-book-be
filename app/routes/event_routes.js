var database = null

module.exports = function (app, db) {
    database = db
    var ObjectID = require('mongodb').ObjectID;

    /* CREATE */
    app.post('/event/add', isAuthenticated, (req, res) => {
        if (req.body.title == null || req.body.title == '') {
            res.send(errorResponse('Title missing'));
        } else if (req.body.description == null || req.body.description == '') {
            res.send(errorResponse('Description missing'));
        } else if (req.body.venue == null || req.body.venue == '') {
            res.send(errorResponse('Venue missing'));
        } else if (req.body.price == null || req.body.price == '') {
            res.send(errorResponse('Price missing'));
        } else if (req.body.time == null || req.body.time == '') {
            res.send(errorResponse('Time missing'));
        } else if (req.body.url == null || req.body.url == '') {
            res.send(errorResponse('Url missing'));
        } else if (req.body.image == null || req.body.image == '') {
            res.send(errorResponse('Image URL missing'));
        } else {
            const event = { title: req.body.title, description: req.body.description, venue: req.body.venue, price: req.body.price, time: req.body.time, url: req.body.url, image: req.body.image, createdAt: Date.now(), likes: 0 };
            db.collection('events').insert(event, (err, result) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse(null, result.ops[0]))
                }
            });
        }
    });

    /* UPDATE */
    app.put('/event/update/:id', isAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(errorResponse('Event id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            const event = { $set: { title: req.body.title, description: req.body.description, venue: req.body.venue, price: req.body.price, time: req.body.time, url: req.body.url, image: req.body.image, updatedAt: Date.now() } };
            db.collection('events').update(details, event, (err, result) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse('Event updated successfully', null))
                }
            });
        }
    });

    /* DELETE */
    app.delete('/event/delete/:id', isAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(errorResponse('Event id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('events').remove(details, (err, item) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse('Event deleted successfully', null))
                }
            });
        }

    });

    /* READ ALL */
    app.get('/event/list', (req, res) => {
        var cursor = db.collection('events').find({});
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(errorResponse(err.errmsg));
            } else {
                res.send(successResponse(null, docs))
            }
        });
    });

    /* READ a single event */
    app.get('/event/:id', (req, res) => {
        if (req.params.id == null) {
            res.send(errorResponse('Event id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('events').findOne(details, (err, item) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse(null, item))
                }
            });
        }
    });

    /* Find events by keyword */
    app.get('/event/search/:keyword', (req, res) => {
        if (req.params.keyword == null || req.params.keyword == '') {
            res.send(errorResponse('Keyword missing'));
        } else {
            var cursor = db.collection('events').find({
                $or: [
                    { title: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } },
                    { description: { $regex: ".*" + req.params.keyword + ".*", '$options': 'i' } }
                ]
            });
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse(null, docs))
                }
            });
        }
    });

    /* Increment Likes on event */
    app.put('/event/like/:id', isUserAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(errorResponse('Event id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('events').update(details, { $inc: { likes: 1 } }, (err, result) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse('Event liked successfully', null))
                }
            });
        }
    });
};

function errorResponse(errorMsg) {
    return { success: false, error: errorMsg }
}

function successResponse(message, data) {
    if (data != null && message != null)
        return { success: true, message: message, data: data }
    else if (data != null)
        return { success: true, data: data }
    if (message != null)
        return { success: true, message: message }
}

function isAuthenticated(req, res, next) {
    if (req.get('authToken') == null)
        res.send(errorResponse("Token is not present"));
    else {
        var authToken = req.get('authToken')
        var cursor = database.collection('admin').find({ authToken: authToken });
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(errorResponse("Token invalid"));
            } else if (docs.length == 0) {
                res.send(errorResponse("Token invalid"));
            } else if (docs.length > 0) {
                return next();
            }
        });
    }
}

function isUserAuthenticated(req, res, next) {
    if (req.get('authToken') == null)
        res.send(errorResponse("Token is not present"));
    else {
        var authToken = req.get('authToken')
        database.collection('users').findOne({ authToken: req.get('authToken') }, (function (err, item) {
            if (err) {
                res.send(errorResponse("Token invalid"));
            } else {
                return next();
            }
        }));
    }
}