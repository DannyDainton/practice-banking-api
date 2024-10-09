const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

// Define the User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  balance: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
});

// Associations
User.hasMany(require('./Transaction').Transaction, {
  foreignKey: 'fromUserId',
  onDelete: 'CASCADE',
});

User.hasMany(require('./Transaction').Transaction, {
  foreignKey: 'toUserId',
  onDelete: 'CASCADE',
});

module.exports = { User };
