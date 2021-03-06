const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const credentials = require('./config/credentials');
const app = express();

const port = 8080;

var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'content-type, authToken');
  next();
}

app.use(bodyParser.json({ extended: true })); //parsing the body parameters 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(allowCrossDomain);

MongoClient.connect(credentials.url, (err, database) => {
  if (err) return console.log(err)
  require('./app/routes')(app, database);
  app.listen(process.env.PORT || port, () => {
    console.log('Our app is live on :' + port);

    /* admin collection */
    database.createCollection('admin')
    database.collection('admin').ensureIndex({ userName: 1 }, { unique: true });

    /* user collection */
    database.createCollection('users')
    database.collection('users').ensureIndex({ email: 1 }, { unique: true });

    /* friends collection */
    database.createCollection('friends')

    /* notifications collection */
    database.createCollection('notifications')

    /* feeds collection */
    database.createCollection('feeds')

    /* activities collection */
    database.createCollection('activities')
  });
})