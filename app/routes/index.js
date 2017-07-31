const userRoutes = require('./user_routes');
const adminRoutes = require('./admin_routes');
const feedsRoutes = require('./feeds_routes');

module.exports = function(app, db) {
  userRoutes(app, db);
  adminRoutes(app, db);
  feedsRoutes(app, db);
};