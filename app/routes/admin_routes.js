const utils = require('../../utils/utils.js')

module.exports = function (app, db) {
    utils.setdatabase(db)
    var ObjectID = require('mongodb').ObjectID;

    /* Admin signup */
    app.post('/admin/signup', (req, res) => {
        if (req.body.userName == null || req.body.userName == '') {
            res.send(utils.errorResponse('user name missing'));
        } else if (req.body.password == null || req.body.password == '') {
            res.send(utils.errorResponse('password missing'));
        } else {
            var authToken = utils.getToken({ userName: req.body.userName, password: req.body.password })
            const adminObject = { userName: req.body.userName, authToken: authToken, createdAt : Date.now() };
            db.collection('admin').insert(adminObject, (err, result) => {
                if (err) {
                    if (String(err.errmsg).includes('duplicate')) // duplicate userName
                        res.send(utils.errorResponse("Username already exist"));
                    else
                        res.send(utils.errorResponse(err.errmsg));
                } else {
                    res.send(utils.successResponse("Admin created successfully", result.ops[0]))
                }
            });
        }
    });

    /* Admin login*/
    app.post('/admin/login', (req, res) => {
        if (req.body.userName == null || req.body.userName == '') {
            res.send(utils.errorResponse('user name missing'));
        } else if (req.body.password == null || req.body.password == '') {
            res.send(utils.errorResponse('password missing'));
        } else {
            const adminObject = { userName: req.body.userName };
            var cursor = db.collection('admin').find(adminObject);
            cursor.toArray(function (err, docs) {
                if (err) {
                    res.send(utils.errorResponse(err.errmsg));
                } else if (docs.length == 0) {
                    res.send(utils.errorResponse("Username not found"));
                } else {
                    var decryptedPassword = utils.decryptPassword(docs[0].authToken)
                    if (decryptedPassword != null) {
                        if (req.body.password == decryptedPassword)
                            res.send(utils.successResponse('Welcome Admin!! ', docs[0]))
                        else
                            res.send(utils.errorResponse("Invalid password"));
                    } else {
                        res.send(utils.errorResponse("Invalid secret key"));
                    }
                }
            });
        }
    });
};