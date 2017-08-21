const credentials = require('../config/credentials.js')

module.exports = {
    sendNotification: function (feedOwnerId, userName, message, feedOwnerDeviceId) {
        var FCM = require('fcm-node');
        var fcm = new FCM(credentials.fcmServerKey);

        var message = {
            to: feedOwnerDeviceId, 
            collapse_key: 'your_collapse_key',
            notification: {
                title: message, body: userName + " " + message, click_action: 'Take him to Notifications page'
            }
        };

        fcm.send(message, function (err, response) {
            if (err) {
                console.log("Something has gone wrong, while sending notification!!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });
    }
};