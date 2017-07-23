var database = null
var multer = require('multer')
var upload = multer({ dest: 'uploads/' })

module.exports = function (app, db) {
    database = db
    var ObjectID = require('mongodb').ObjectID;

    /* CREATE */
    app.post('/post/add', upload.single('content'), (req, res) => {
        var AWS = require('aws-sdk');
        AWS.config.loadFromPath('./config/aws-config.json');
        const configFile = require('../../config/db');
        var s3Bucket = new AWS.S3({ params: { Bucket: configFile.s3BucketName } })
        var fs = require('fs');
        var file = req.file;
        fs.readFile(file.path, function (err, data) {
            if (err) throw err; // Something went wrong!
            s3Bucket.createBucket(function () {
                var params = { Key: file.filename, Body: data };
                s3Bucket.upload(params, function (err, data) {
                    fs.unlink(file.path, function (err) {
                        if (err) { console.error(err); }
                    });
                    if (err) {
                        res.send(errorResponse('Something went wrong!!'))
                    } else {
                        const post = { contentDescription: req.body.contentDescription, contentUrl: data['Location'], contentType: req.body.contentType, createdAt: Date.now(), likes: 0 };
                        db.collection('posts').insert(post, (err, result) => {
                            if (err) {
                                res.send(errorResponse(err.errmsg));
                            } else {
                                res.send(successResponse("Posted successfully", result.ops[0]))
                            }
                        });
                    }
                });
            });
        });
    });
};

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

function findUserByToken(req, res, next) {
    if (req.get('authToken') == null) {
        console.log("Token is not present");
        return next();
    } else {
        var authToken = req.get('authToken')
        database.collection('users').findOne({ authToken: req.get('authToken') }, (function (err, item) {
            if (err) {
                console.log("Token invalid");
                return next();
            } else {
                user = item
                return next();
            }
        }));
    }
}