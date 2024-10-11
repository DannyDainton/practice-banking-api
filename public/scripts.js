async function fetchUsers() {
  try {
    const response = await fetch("/users");
    const users = await response.json();

    updateUsersList(users);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

function updateUsersList(users) {
  const usersTableBody = document.getElementById("users-body");

  if (!usersTableBody) {
    console.warn("Error: users-body element not found in the DOM.");
    return;
  }

  if (Array.isArray(users)) {
    usersTableBody.innerHTML = "";

    users.forEach((user) => {
      const userRow = document.createElement("tr");
      userRow.setAttribute("id", `user-row-${user.id}`);

      userRow.innerHTML = `
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.balance}</td>
        <td>
          <button class="button is-small is-link" onclick="copyToClipboard('${user.id}')">Copy ID</button>
          <button id="delete-user" class="button is-danger is-small" onclick="confirmDeleteUser('${user.id}')">Delete</button>
        </td>
      `;

      usersTableBody.appendChild(userRow);
    });
  } else if (typeof users === "object" && users !== null) {
    const existingUserRow = document.getElementById(`user-row-${users.id}`);

    if (existingUserRow) {
      existingUserRow.innerHTML = `
        <td>${users.id}</td>
        <td>${users.name}</td>
        <td>${users.balance}</td>
        <td>
          <button class="button is-small is-link" onclick="copyToClipboard('${users.id}')">Copy ID</button>
          <button id="delete-user" class="button is-danger is-small" onclick="confirmDeleteUser('${users.id}')">Delete</button>
        </td>
      `;
    } else {
      const userRow = document.createElement("tr");
      userRow.setAttribute("id", `user-row-${users.id}`);

      userRow.innerHTML = `
        <td>${users.id}</td>
        <td>${users.name}</td>
        <td>${users.balance}</td>
        <td>
          <button class="button is-small is-link" onclick="copyToClipboard('${users.id}')">Copy ID</button>
          <button id="delete-user" class="button is-danger is-small" onclick="confirmDeleteUser('${users.id}')">Delete</button>
        </td>
      `;

      usersTableBody.appendChild(userRow);
    }
  } else {
    console.error(
      "Invalid input provided to updateUsersList. Must be an array or a user object."
    );
  }
}

// Create a new user
document
  .getElementById("create-user-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("userName").value;
    const initialBalance = parseFloat(
      document.getElementById("initialBalance").value
    );

    try {
      await axios.post("/user", { name, initialBalance });

      document.getElementById("user-error").style.display = "none";
      document.getElementById("create-user-form").reset();

      fetchUsers();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while creating the user";
      document.getElementById("user-error").textContent = errorMessage;
      document.getElementById("user-error").style.display = "block";
      console.error("Error creating user:", error);
    }
  });

document
  .getElementById("single-user-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = document.getElementById("singleUserId").value;

    try {
      const userResponse = await axios.get(`/user/${userId}`);
      const user = userResponse.data;

      document.getElementById("single-user-error").style.display = "none";
      document.getElementById("user-details").style.display = "block";

      document.getElementById("user-name").innerHTML = `${user.name}`;
      document.getElementById("user-balance").innerHTML = `${user.balance}`;
      document.getElementById("user-joined").innerHTML = `${(user.createdAt).split("T")[0]}`;

      const transactionsResponse = await axios.get(`/transactions/${userId}`);
      const transactions = transactionsResponse.data;

      const transactionsBody = document.getElementById(
        "user-transactions-body"
      );
      transactionsBody.innerHTML = "";

      transactions.forEach((tx) => {
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
      const errorMessage = error.response?.data?.error || "User not found";
      document.getElementById("single-user-error").textContent = errorMessage;
      document.getElementById("single-user-error").style.display = "block";
      document.getElementById("user-details").style.display = "none";
      document.getElementById("user-transactions-body").style.display = "none";
      console.error("Error fetching user details or transactions:", error);
    }
  });

let userIdToDelete = null;

function confirmDeleteUser(userId) {
  userIdToDelete = userId;
  const deleteModal = document.getElementById("deleteModal");
  deleteModal.classList.add("is-active");
}

document.getElementById("confirmDelete").addEventListener("click", () => {
  if (userIdToDelete !== null) {
    deleteUser(userIdToDelete);
  }
  closeModal();
});

document.getElementById("cancelDelete").addEventListener("click", closeModal);
document.querySelector(".modal-close").addEventListener("click", closeModal);

function closeModal() {
  const deleteModal = document.getElementById("deleteModal");
  deleteModal.classList.remove("is-active");
}

function loadUserProfile(user) {
  const userDetailsElem = document.getElementById("user-details");

  userDetailsElem.setAttribute("data-user-id", user.id);

  document.getElementById("user-name").textContent = user.name;
  document.getElementById("user-balance").textContent = user.balance;
  document.getElementById("user-joined").textContent = (user.joinedDate).split("T")[0];

  userDetailsElem.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  const editProfileBtn = document.getElementById("edit-profile-btn");
  const userNameElem = document.getElementById("user-name");
  const editUsernameInput = document.getElementById("edit-username");
  const saveUsernameBtn = document.getElementById("save-username");
  const cancelEditBtn = document.getElementById("cancel-edit");
  const userIdInput = document.getElementById("singleUserId");

  let originalUsername = "";

  editProfileBtn.addEventListener("click", () => {
    userNameElem.style.display = "none";
    editUsernameInput.style.display = "inline-block";
    saveUsernameBtn.style.display = "inline-block";
    cancelEditBtn.style.display = "inline-block";

    editUsernameInput.value = originalUsername;
  });

  saveUsernameBtn.addEventListener("click", async () => {
    const newUsername = editUsernameInput.value.trim();
    const userId = userIdInput.value;

    if (!newUsername) {
      return;
    }

    if (!userId) {
      return;
    }

    try {
      const response = await fetch(`/user/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newUsername }),
      });

      if (response.ok) {
        const data = await response.json();

        userNameElem.textContent = data.user.name;

        userNameElem.style.display = "inline-block";
        editUsernameInput.style.display = "none";
        saveUsernameBtn.style.display = "none";
        cancelEditBtn.style.display = "none";
      } else {
        const errorData = await response.json();
        console.error("Failed to update username: " + errorData.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });
  cancelEditBtn.addEventListener("click", () => {
    editUsernameInput.value = originalUsername;

    userNameElem.style.display = "inline-block";
    editUsernameInput.style.display = "none";
    saveUsernameBtn.style.display = "none";
    cancelEditBtn.style.display = "none";
  });
});

async function deleteUser(userId) {
  try {
    await axios.delete(`/user/${userId}`);

    fetchUsers();

    socket.send(JSON.stringify({ type: "REFRESH_TRANSACTIONS" }));
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}

async function fetchTransactions() {
  try {
    const response = await axios.get("/transactions");
    const transactions = response.data;
    const transactionsBody = document.getElementById("transactions-body");

    transactionsBody.innerHTML = "";

    transactions.forEach((transaction) => {
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
    console.error("Error fetching transactions:", error);
  }
}

async function refreshTransactions() {
  try {
    const response = await axios.get("/transactions");

    const transactionsList = document.getElementById("transactions-list");
    transactionsList.innerHTML = "";

    response.data.forEach((transaction) => {
      const transactionItem = document.createElement("li");
      transactionItem.textContent = `Transaction: ${transaction.fromUserId} -> ${transaction.toUserId}, Amount: $${transaction.amount}`;
      transactionsList.appendChild(transactionItem);
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    alert("Failed to refresh transactions: " + error.message);
  }
}

document
  .getElementById("transaction-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const fromUserId = document.getElementById("fromUserId").value;
    const toUserId = document.getElementById("toUserId").value;
    const amount = parseFloat(document.getElementById("amount").value);

    try {
      await axios.post("/transaction", { fromUserId, toUserId, amount });

      // Clear the form
      document.getElementById("transaction-form").reset();
      document.getElementById("transaction-error").style.display = "none";

      fetchUsers();
      fetchTransactions();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "An error occurred during the transaction";
      document.getElementById("transaction-error").textContent = errorMessage;
      document.getElementById("transaction-error").style.display = "block";
      console.error("Error creating transaction:", error);
    }
  });

function copyToClipboard(userId) {
  const tempInput = document.createElement("input");
  tempInput.value = userId;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);

  const notification = document.getElementById("copy-notification");
  notification.textContent = `UserId ${userId} copied to the clipboard!`;
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 2000);
}

fetchUsers();
fetchTransactions();

let socket;

function connectWebSocket() {
  socket = new WebSocket("ws://localhost:3000");

  socket.onopen = function () {
    console.log("WebSocket connection established");
  };

  socket.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.type === "INITIAL_DATA") {
      if (Array.isArray(data.users)) {
        updateUsersList(data.users);
      } else {
        updateUsersList([]);
      }

      if (Array.isArray(data.transactions)) {
        updateTransactionsList(data.transactions);
      } else {
        updateTransactionsList([]);
      }
    }

    if (data.type === "UPDATED_TRANSACTIONS") {
      if (Array.isArray(data.transactions)) {
        updateTransactionsList(data.transactions);
      } else {
        updateTransactionsList([]);
      }
    }

    if (data.type === "userUpdated") {
      updateUsersList(data.user);
    }

    if (data.type === "userCreated") {
      updateUsersList(data.user);
    }
  };

  socket.onclose = function () {
    console.log(
      "WebSocket connection closed. Attempting to reconnect in 3 seconds..."
    );
    setTimeout(connectWebSocket, 3000);
  };

  socket.onerror = function (error) {
    console.error("WebSocket error:", error);
  };
}

connectWebSocket();

function updateTransactionsList(transactions) {
  const transactionsList = document.getElementById("transactions-list");

  if (!transactionsList) {
    console.warn("Error: transactions-list element not found in the DOM.");
    return;
  }

  transactionsList.innerHTML = "";

  transactions.forEach((transaction) => {
    const listItem = document.createElement("li");
    listItem.textContent = `Transaction: ${transaction.fromUserId} -> ${transaction.toUserId}, Amount: ${transaction.amount}`;
    transactionsList.appendChild(listItem);
  });
}
