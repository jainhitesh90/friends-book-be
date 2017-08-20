var FCM = require('fcm-node');
var serverKey = 'AAAAMN_kfGo:APA91bHlzccbwZbQo7NkWlBoRqleCUdVQKjZ6kQWgC4bmP3kdz61Bl8_kOLmaa7Rv9pv6OROALiFbqhyJZLfByKsi9p5bbiV_YPI7pV7spppP-2_q74Xhc8O7P3Q-dueoE_xry2o9aW7 ';
var fcm = new FCM(serverKey);

var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera) 
    to: 'registration_token',
    collapse_key: 'your_collapse_key',

    notification: {
        title: 'Title of your push notification',
        body: 'Body of your push notification'
    },

    data: {
        my_key: 'my value',
        my_another_key: 'my another value'
    }
};

fcm.send(message, function (err, response) {
    if (err) {
        console.log("Something has gone wrong, while sending notification!!");
    } else {
        console.log("Successfully sent with response: ", response);
    }
});