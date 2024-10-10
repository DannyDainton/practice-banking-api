const express = require('express');
const WebSocket = require('ws');
const { sequelize } = require('./models');
const { User } = require('./models/User');
const { Transaction } = require('./models/Transaction');
const { Op } = require('sequelize');

const app = express();
app.use(express.static('public'));
app.use(express.json());

// Sync The Database
sequelize.sync({ force: true }).then(() => {
  console.log('Database connected and synced');
});

function broadcastUpdate(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

async function sendInitialData(ws) {
  try {
    const users = await User.findAll();
    const transactions = await Transaction.findAll();
    
    ws.send(JSON.stringify({ type: 'INITIAL_DATA', users, transactions }));
  } catch (error) {
    console.error('Error sending initial data:', error);
  }
}

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});  

// Get All Users Route
app.get('/users', async (req, res) => {
    try {
      const users = await User.findAll();
  
      return res.status(200).json(users);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve users' });
    }
});

// Get Single User Route
app.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
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
    const user = await User.create({
      name,
      balance: initialBalance
    });

    broadcastUpdate({ type: 'userCreated', user });

    return res.status(201).json({ message: 'User created', userId: user.id, userName: user.name, balance: user.balance });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete User Route
app.delete('/user/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const user = await User.findByPk(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Delete the user
      await user.destroy();

      broadcastUpdate({ type: 'userDeleted', userId });
  
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
    const fromUser = await User.findByPk(fromUserId);
    const toUser = await User.findByPk(toUserId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (fromUser.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ error: 'Unable to make transactions to your own account' });
    }

    await sequelize.transaction(async (t) => {
      fromUser.balance -= amount;
      toUser.balance += amount;

      await Transaction.create({
        fromUserId,
        toUserId,
        amount
      }, { transaction: t });

      await fromUser.save({ transaction: t });
      await toUser.save({ transaction: t });
    });

    broadcastUpdate({ type: 'transaction', fromUserId, toUserId, amount });

    return res.status(200).json({ message: 'Transaction successful', fromUser, toUser });
  } catch (err) {
    return res.status(500).json({ error: 'Transaction failed' });
  }
});

app.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.findAll();

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.get('/transactions/:userId', async (req, res) => {
  const { userId } = req.params;

  try {

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      }
    });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch user transactions' });
  }
});


// Start The Server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

function broadcastData(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', ws => {
  console.log('New client connected');
  sendInitialData(ws);

  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'REFRESH_TRANSACTIONS') {
      // Fetch and broadcast updated transactions to all clients
      const transactions = await Transaction.findAll();
      broadcastData({ type: 'UPDATED_TRANSACTIONS', transactions });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});