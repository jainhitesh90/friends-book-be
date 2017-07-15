const blogRoutes = require('./blog_routes');
const userRoutes = require('./user_routes');
const categoryRoutes = require('./category_routes');

module.exports = function(app, db) {
  blogRoutes(app, db);
  userRoutes(app, db);
  categoryRoutes(app, db);
};