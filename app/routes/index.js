const blogRoutes = require('./blog_routes');
const eventRoutes = require('./event_routes');
const userRoutes = require('./user_routes');
const adminRoutes = require('./admin_routes');
const feedsRoutes = require('./feeds_routes');

module.exports = function(app, db) {
  blogRoutes(app, db);
  eventRoutes(app, db);
  userRoutes(app, db);
  adminRoutes(app, db);
  feedsRoutes(app, db);
};