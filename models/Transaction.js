const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Transaction = sequelize.define('Transaction', {
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  toUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = { Transaction };
