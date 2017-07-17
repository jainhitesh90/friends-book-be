var database = null

module.exports = function (app, db) {
    database = db
    var ObjectID = require('mongodb').ObjectID;

     /* CREATE */
    app.post('/blog/add', isAuthenticated, (req, res) => {
        if (req.body.title == null || req.body.title == '') {
            res.send(errorResponse('Title missing'));
        } else if (req.body.description == null || req.body.description == '') {
            res.send(errorResponse('Description missing'));
        } else if (req.body.category == null || req.body.category == '') {
            res.send(errorResponse('Category Name missing'));
        } else if (req.body.fullUrl == null || req.body.fullUrl == '') {
            res.send(errorResponse('Full URL missing'));
        } else {
            //validate category name first
            var cursor = db.collection('categories').find({
                category: req.params.category
            });
            cursor.toArray(function (err, docs) {
                if (err) { //invalid category name
                    res.send(errorResponse(err.errmsg));
                } else { //valid category name
                    const blog = { title: req.body.title, description: req.body.description, category: req.body.category, fullUrl: req.body.fullUrl };
                    db.collection('blogs').insert(blog, (err, result) => {
                        if (err) {
                            res.send(errorResponse(err.errmsg));
                        } else {
                            res.send(successResponse(null, result.ops[0]))
                        }
                    });
                } 
            });
        }
    });

    /* UPDATE */
    app.put('/blog/update/:id', isAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(errorResponse('Blog id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            const blog = { title: req.body.title, description: req.body.description, category: req.body.category, fullUrl: req.body.fullUrl };
            db.collection('blogs').update(details, blog, (err, result) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse('Blog updated successfully', null))
                }
            });
        }
    });

    /* DELETE */
    app.delete('/blog/delete/:id', isAuthenticated, (req, res) => {
        if (req.params.id == null) {
            res.send(errorResponse('Blog id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('blogs').remove(details, (err, item) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse('Blog deleted successfully', null))
                }
            });
        }

    });

     /* READ ALL */
    app.get('/blog/list', (req, res) => {
        var cursor = db.collection('blogs').find({});
        cursor.toArray(function (err, docs) {
            if (err) {
                res.send(errorResponse(err.errmsg));
            } else {
                res.send(successResponse(null, docs))
            }
        });
    });

    /* READ */
    app.get('/blog/:id', (req, res) => {
        if (req.params.id == null) {
            res.send(errorResponse('Blog id missing'));
        } else {
            const id = req.params.id;
            const details = { '_id': new ObjectID(id) };
            db.collection('blogs').findOne(details, (err, item) => {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse(null, item))
                }
            });
        }
    });
    
    /* Find blogs by category */
    app.get('/blog/getBlogsByCategory/:category', (req, res) => {
        if (req.params.categoryId == null || req.params.categoryId == '') {
            res.send(errorResponse('Category Id missing'));
        } else {
            var cursor = db.collection('blogs').find({
                categoryId: req.params.categoryId
            });
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse(null, docs[0]))
                }
            });
        }
    });

    /* Find blogs by keyword */
    app.get('/blog/search/:keyword', (req, res) => {
        if (req.params.keyword == null || req.params.keyword == '') {
            res.send(errorResponse('Keyword missing'));
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
                    res.send(errorResponse(err.errmsg));
                } else {
                    res.send(successResponse(null, docs))
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
            if (docs.length == 0) {
                res.send(errorResponse("Token invalid"));
            } else if (docs.length > 0) {
                return next();
            }
        });
    }
}