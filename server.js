const express = require('express');
const { sequelize } = require('./models'); // Import Sequelize instance
const { User } = require('./models/User'); // Import the User model

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// Sync the database
sequelize.sync().then(() => {
  console.log('Database connected and synced');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});  

// Get All Users Route
app.get('/users', async (req, res) => {
    try {
      // Fetch all users from the database
      const users = await User.findAll();
  
      // Return the list of users
      return res.status(200).json(users);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve users' });
    }
});

app.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Find the user by ID
      const user = await User.findByPk(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      return res.status(200).json(user);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve user' });
    }
});

// Create User Route
app.post('/user', async (req, res) => {
  const { name, initialBalance } = req.body;

  if (!name || typeof initialBalance !== 'number' || initialBalance < 0) {
    return res.status(400).json({ error: 'Invalid user data' });
  }

  try {
    // Create a new user in the database
    const user = await User.create({
      name,
      balance: initialBalance
    });

    return res.status(201).json({ message: 'User created', userId: user.id, balance: user.balance });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete User Route
app.delete('/user/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Find the user by ID
      const user = await User.findByPk(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Delete the user
      await user.destroy();
  
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Make Transaction Route
app.post('/transaction', async (req, res) => {
  const { fromUserId, toUserId, amount } = req.body;

  if (!fromUserId || !toUserId || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid transaction data' });
  }

  try {
    // Find both users in the database
    const fromUser = await User.findByPk(fromUserId);
    const toUser = await User.findByPk(toUserId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (fromUser.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Update balances in a transaction
    await sequelize.transaction(async (t) => {
      fromUser.balance -= amount;
      toUser.balance += amount;

      await fromUser.save({ transaction: t });
      await toUser.save({ transaction: t });
    });

    return res.status(200).json({ message: 'Transaction successful', fromUser, toUser });
  } catch (err) {
    return res.status(500).json({ error: 'Transaction failed' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
