'use strict';
module.exports = function(sequelize, DataTypes) {
  var vote = sequelize.define('vote', {
    user_id: DataTypes.INTEGER,
    yelp_id: DataTypes.STRING,
    value: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        models.vote.belongsTo(models.user, {foreignKey: "user_id"});
      }
    }
  });
  return vote;
};