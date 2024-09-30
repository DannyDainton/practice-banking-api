const { sequelize } = require('./models'); 
const { User } = require('./models/User');
const { Transaction } = require('./models/Transaction'); 

async function clearDatabase() {
  try {
    // Delete all records from each table
    await sequelize.transaction(async (t) => {
      await User.destroy({ where: {}, truncate: true, cascade: true, transaction: t });
      await Transaction.destroy({ where: {}, truncate: true, cascade: true, transaction: t });
    });

    console.log('Database cleared successfully.');
    process.exit(0);  // Exit the script after completion
  } catch (error) {
    console.error('Failed to clear the database:', error);
    process.exit(1);  // Exit with an error code
  }
}

clearDatabase();