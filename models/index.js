const { Sequelize } = require('sequelize');

// Initialize Sequelize to use SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'  // The file where data will be stored
});

module.exports = { sequelize };
