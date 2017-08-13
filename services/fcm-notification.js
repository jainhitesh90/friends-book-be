const credentials = require('../config/credentials.js')

module.exports = {
    updateNotificationDocument : function(db, id, fcmToken, content, redirectUrl){
        const notification = { userId : id, content: content, redirectUrl : redirectUrl, createdAt: Date.now() };
        db.collection('notifications').insert(notification, (err, result) => {
            if (err) {
                console.log("error : " + err.errmsg)
            } else {
                if (fcmToken != null)
                    module.exports.sendNotification(content, redirectUrl, fcmToken)
                else
                    console.log("user dint registered for notifications")
            }
        });
    },

    sendNotification: function (content, redirectUrl, fcmToken) {
        var FCM = require('fcm-node');
        var fcm = new FCM(credentials.fcmServerKey);
        var message = {
            to: fcmToken, 
            collapse_key: 'your_collapse_key',
            notification: {
                title: message, body: content, redirectUrl : redirectUrl, click_action: 'Take him to Notifications page'
            }
        };

        fcm.send(message, function (err, response) {
            if (err) {
                console.log("Something has gone wrong!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });
    }
};