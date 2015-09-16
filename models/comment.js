'use strict';
module.exports = function(sequelize, DataTypes) {
  var comment = sequelize.define('comment', {
    body: DataTypes.TEXT,
    user_id: DataTypes.INTEGER,
    yelp_id: DataTypes.STRING,
    love: DataTypes.INTEGER,
    hate: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        models.comment.belongsTo(models.user, {foreignKey:"user_id"});
      }
    }
  });
  return comment;
};