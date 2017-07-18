var database = null

module.exports = function (app, db) {
    database = db
    var ObjectID = require('mongodb').ObjectID;
    var indexJs = require('./index.js');

    /* CREATE */

    app.post('/category/add', isAuthenticated, function (req, res) {
        if (req.body.category == null || req.body.category == '') {
            res.send(errorResponse('Category missing'));
        } else {
            const category = { category: req.body.category };
            db.collection('categories').insert(category, (err, result) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse(null, result.ops[0]))
                }
            });
        }
    });

    /* UPDATE */
    app.put('/category/update/:id', isAuthenticated, (req, res) => {
        if (req.params.id == null || req.params.id.length != 24) {
            res.send(errorResponse('Invalid ID'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            const category = { category: req.body.category };
            db.collection('categories').update(details, category, (err, result) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse('Category updated successfully', category))
                }
            });
        }
    });

    /* DELETE */
    app.delete('/category/delete/:id', isAuthenticated, (req, res) => {
        if (req.params.id == null || req.params.id.length != 24) {
            res.send(errorResponse('Invalid ID'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('categories').remove(details, (err, item) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse('Category deleted successfully', null))
                }
            });
        }
    });

    /* READ ALL */
    app.get('/category/list', isAuthenticated, (req, res) => {
        db.collection('categories').find({}).toArray(function (err, docs) {
            if (err) {
                res.send(errorResponse(err.errmsg));
            } else {
                res.send(successResponse(null, docs))
            }
        });
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
            if (docs.length == 0) {
                res.send(errorResponse("Token invalid"));
            } else if (docs.length > 0) {
                return next();
            }
        });
    }
}