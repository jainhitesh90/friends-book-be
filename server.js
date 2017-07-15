const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const db = require('./config/db');
const app = express();

const port = 8080;

app.use(bodyParser.urlencoded({ extended: true })); //parsing the body parameters 

MongoClient.connect(db.url, (err, database) => {
  if (err) return console.log(err)
  require('./app/routes')(app, database);
  app.listen(port, () => {
    console.log('We are live on ' + port);

    /* blogs collection */
    database.createCollection('blogs')
    database.collection('blogs').ensureIndex({ fullUrl : 1 }, { unique: true });

    /* category collection */
    database.createCollection('categories')
    database.collection('categories').ensureIndex({ category : 1 }, { unique: true });

    /* user collection */
    database.createCollection('users')
    database.collection('users').ensureIndex({ email : 1 }, { unique: true });
  });
})