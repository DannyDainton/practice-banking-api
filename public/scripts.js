// Fetch and display users
async function fetchUsers() {
    try {
      const response = await axios.get('/users'); // API call to get users
      const users = response.data;
      const usersBody = document.getElementById('users-body');
  
      // Clear existing rows
      usersBody.innerHTML = '';
  
      // Populate user rows
      users.forEach(user => {
        const row = `
          <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.balance}</td>
            <td>
              <button class="button is-small is-link" onclick="copyToClipboard('${user.id}')">Copy ID</button>
              <button id="delete-user" class="button is-danger is-small" onclick="confirmDeleteUser('${user.id}')">Delete</button>
            </td>
          </tr>
        `;
        usersBody.innerHTML += row;
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }
  
  // Create a new user
  document.getElementById('create-user-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent page refresh
  
    const name = document.getElementById('userName').value;
    const initialBalance = parseFloat(document.getElementById('initialBalance').value);
  
    try {
      // API call to create a new user
      await axios.post('/user', { name, initialBalance });
  
      // Clear the form
      document.getElementById('user-error').style.display = 'none';
      document.getElementById('create-user-form').reset();
  
      // Refresh user list
      fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred while creating the user';
      document.getElementById('user-error').textContent = errorMessage;
      document.getElementById('user-error').style.display = 'block';
      console.error('Error creating user:', error);
    }
  });

  document.getElementById('single-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const userId = document.getElementById('singleUserId').value;
  
    try {
      // Fetch the user details
      const userResponse = await axios.get(`/user/${userId}`);
      const user = userResponse.data;

      document.getElementById('single-user-error').style.display = 'none';
      document.getElementById('user-details').style.display = 'block';
  
      // Update user details
      document.getElementById('user-name').innerHTML = `${user.name}`;
      document.getElementById('user-balance').innerHTML = `${user.balance}`;
      document.getElementById('user-email').innerHTML = `${user.name}@example.com`;
      document.getElementById('user-joined').innerHTML = `${user.createdAt}`;
  
      // Fetch and display user's transactions
      const transactionsResponse = await axios.get(`/transactions/${userId}`);
      const transactions = transactionsResponse.data;
  
      const transactionsBody = document.getElementById('user-transactions-body');
      transactionsBody.innerHTML = ''; // Clear previous transactions
  
      transactions.forEach(tx => {
        const row = `<tr>
          <td>${tx.id}</td>
          <td>${tx.createdAt}</td>
          <td>${tx.fromUserId}</td>
          <td>${tx.toUserId}</td>
          <td>${tx.amount}</td>
        </tr>`;
        transactionsBody.innerHTML += row;
      });
  
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'User not found';
        document.getElementById('single-user-error').textContent = errorMessage;
        document.getElementById('single-user-error').style.display = 'block';
        document.getElementById('user-details').style.display = 'none';
        document.getElementById('user-transactions-body').style.display = 'none';
        console.error('Error fetching user details or transactions:', error);
    }
  });
  
  let userIdToDelete = null;

  function confirmDeleteUser(userId) {
      userIdToDelete = userId;
      const deleteModal = document.getElementById('deleteModal');
      deleteModal.classList.add('is-active');
  }

  document.getElementById('confirmDelete').addEventListener('click', () => {
      if (userIdToDelete !== null) {
          deleteUser(userIdToDelete);
      }
      closeModal();
  });

  document.getElementById('cancelDelete').addEventListener('click', closeModal);
  document.querySelector('.modal-close').addEventListener('click', closeModal);

  function closeModal() {
      const deleteModal = document.getElementById('deleteModal');
      deleteModal.classList.remove('is-active');
  }
  
  // Delete a user
  async function deleteUser(userId) {
    try {
      // API call to delete the user
      await axios.delete(`/user/${userId}`);
      
      // Refresh the user list
      fetchUsers();
  
      // Refresh the transactions list
      socket.send(JSON.stringify({ type: 'REFRESH_TRANSACTIONS' }));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }
  
  // Fetch and display transactions
  async function fetchTransactions() {
    try {
      const response = await axios.get('/transactions'); // API call to get transactions
      const transactions = response.data;
      const transactionsBody = document.getElementById('transactions-body');
  
      // Clear existing rows
      transactionsBody.innerHTML = '';
  
      // Populate transaction rows
      transactions.forEach(transaction => {
        const row = `
          <tr>
            <td>${transaction.id}</td>
            <td>${transaction.createdAt}</td>
            <td>${transaction.fromUserId}</td>
            <td>${transaction.toUserId}</td>
            <td>${transaction.amount}</td>
          </tr>
        `;
        transactionsBody.innerHTML += row;
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }

  async function refreshTransactions() {
    try {
      const response = await axios.get('/transactions');
  
      // Clear the current transactions list
      const transactionsList = document.getElementById('transactions-list');
      transactionsList.innerHTML = '';
  
      // Re-populate the transactions list with updated data
      response.data.forEach(transaction => {
        const transactionItem = document.createElement('li');
        transactionItem.textContent = `Transaction: ${transaction.fromUserId} -> ${transaction.toUserId}, Amount: $${transaction.amount}`;
        transactionsList.appendChild(transactionItem);
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('Failed to refresh transactions: ' + error.message);
    }
  }
  
  // Handle transaction form submission
  document.getElementById('transaction-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent page refresh
  
    const fromUserId = document.getElementById('fromUserId').value;
    const toUserId = document.getElementById('toUserId').value;
    const amount = parseFloat(document.getElementById('amount').value);
  
    try {
      // API call to create a new transaction
      await axios.post('/transaction', { fromUserId, toUserId, amount });
  
      // Clear the form
      document.getElementById('transaction-form').reset();
      document.getElementById('transaction-error').style.display = 'none';
  
      // Refresh the user and transaction lists
      fetchUsers();
      fetchTransactions();
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'An error occurred during the transaction';
        document.getElementById('transaction-error').textContent = errorMessage;
        document.getElementById('transaction-error').style.display = 'block';
        console.error('Error creating transaction:', error);
    }
  });

  function copyToClipboard(userId) {
    const tempInput = document.createElement('input');
    tempInput.value = userId;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    // Show notification
    const notification = document.getElementById('copy-notification');
    notification.textContent = `User ID ${userId} copied to clipboard!`;
    notification.style.display = 'block';
    
    // Hide the notification after 2 seconds
    setTimeout(() => {
      notification.style.display = 'none';
    }, 2000);
  }  
  
  // Initialize by fetching users and transactions
  fetchUsers();
  fetchTransactions();
  
  let socket;

  // Function to connect/reconnect to the WebSocket server
  function connectWebSocket() {
    socket = new WebSocket('ws://localhost:3000'); // Adjust the WebSocket URL if necessary
  
    // Handle WebSocket connection open
    socket.onopen = function () {
      console.log('WebSocket connection established');
    };
  
    // Handle receiving messages from the server
    socket.onmessage = function (event) {
      const data = JSON.parse(event.data);
  
      if (data.type === 'INITIAL_DATA') {
        // Safely check if data.users exists and is an array
        if (Array.isArray(data.users)) {
          updateUsersList(data.users);
        } else {
          // Handle the case where there are no users
          updateUsersList([]); // Pass an empty array to clear the users list
        }
      
        // Safely check if data.transactions exists and is an array
        if (Array.isArray(data.transactions)) {
          updateTransactionsList(data.transactions);
        } else {
          // Handle the case where there are no transactions
          updateTransactionsList([]); // Pass an empty array to clear the transactions list
        }
      }

      if (data.type === 'UPDATED_TRANSACTIONS') {
        if (Array.isArray(data.transactions)) {
            updateTransactionsList(data.transactions);
          } else {
            // Handle the case where there are no transactions
            updateTransactionsList([]); // Pass an empty array to clear the transactions list
          }
      }
    };
  
    // Handle WebSocket connection close and attempt to reconnect
    socket.onclose = function () {
      console.log('WebSocket connection closed. Attempting to reconnect in 3 seconds...');
      setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
    };
  
    // Handle errors
    socket.onerror = function (error) {
      console.error('WebSocket error:', error);
    };
  }
  
  // Call the function to initially connect to WebSocket
  connectWebSocket();
  
  // Function to update users list in the DOM
  function updateUsersList(users) {
    const usersList = document.getElementById('users-list');
  
    // Ensure usersList element exists before trying to modify it
    if (!usersList) {
      console.warn('Error: users-list element not found in the DOM.');
      return;
    }
  
    usersList.innerHTML = ''; // Clear current list
    
    users.forEach(user => {
      const listItem = document.createElement('li');
      listItem.textContent = `${user.name} - ${user.balance}`;
      usersList.appendChild(listItem);
    });
  }
  
  
  // Function to update transactions list in the DOM
  function updateTransactionsList(transactions) {
    const transactionsList = document.getElementById('transactions-list');

    if (!transactionsList) {
        console.warn('Error: transactions-list element not found in the DOM.');
        return;
    }

    transactionsList.innerHTML = ''; // Clear current list
  
    transactions.forEach(transaction => {
      const listItem = document.createElement('li');
      listItem.textContent = `Transaction: ${transaction.fromUserId} -> ${transaction.toUserId}, Amount: ${transaction.amount}`;
      transactionsList.appendChild(listItem);
    });
  }
