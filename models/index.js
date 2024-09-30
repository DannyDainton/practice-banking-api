const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  dialectOptions: {
    foreignKeys: true
  }
});

sequelize.query('PRAGMA foreign_keys = ON');

module.exports = { sequelize };
