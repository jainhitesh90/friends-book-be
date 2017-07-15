module.exports = function (app, db) {
    var ObjectID = require('mongodb').ObjectID;

    /* CREATE */
    app.post('/blog/add', (req, res) => {
        if (req.body.title == null || req.body.title == '') {
            res.send(errorResponse('Title missing'));
        } else if (req.body.description == null || req.body.description == '') {
            res.send(errorResponse('Description missing'));
        } else if (req.body.category == null || req.body.category == '') {
            res.send(errorResponse('Category missing'));
        } else if (req.body.fullUrl == null || req.body.fullUrl == '') {
            res.send(errorResponse('Full URL missing'));
        } else {
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

    /* UPDATE */
    app.put('/blog/update/:id', (req, res) => {
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
                    res.send(successResponse(null, result.ops[0]))
                }
            });
        }
    });

    /* DELETE */
    app.delete('/blog/delete/:id', (req, res) => {
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

    /* Find blogs by category */
    app.get('/blog/getBlogsByCategory', (req, res) => {
        if (req.body.category == null || req.body.category == '') {
            res.send(errorResponse('Category name  missing'));
        } else {
            var cursor = db.collection('blogs').find({ category: req.body.category });
            if (err) {
                res.send(errorResponse(err.errmsg));
            } else {
                res.send(successResponse(null, docs))
            }
        }
    });

    /* Find blogs by category keyword */
    app.get('/blog/getBlogsByCategory', (req, res) => {
        if (req.body.keyword == null || req.body.keyword == '') {
            res.send(errorResponse('Keyword missing'));
        } else {
            var cursor = db.collection('blogs').find({ title: req.body.keyword } || { description: req.body.keyword });
            if (err) {
                res.send(errorResponse(err.errmsg));
            } else {
                res.send(successResponse(null, docs))
            }
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