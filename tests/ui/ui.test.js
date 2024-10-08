const { test, expect } = require('@playwright/test');

// Get the BASE_URL from the environment or default to localhost:3000
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

test.describe('Banking App UI Tests', () => {

  // Before each test, go to the main page
  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  // 1. Test case: Check the page title
  test('should have the correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Example Banking Application');
  });

  // 2. Test case: Create a user and check if it's added to the list
  test('should create a user and display in the user list', async ({ page }) => {
    let userName = `John Doe-${randomInteger(1, 50)}`
    
    // Fill the create user form
    await page.fill('#userName', userName);
    await page.fill('#initialBalance', '1000');
    await page.click('#createUser');

    // Wait for the user to be added to the table
    const userList = page.locator('#users-body');
    await expect(userList).toContainText(userName);

    // Find the delete button for this user and click it
    const deleteButton = userList.locator('tr', { hasText: userName }).locator('#delete-user');
    await deleteButton.click();

    const confirmDeleteUser = page.locator('#confirmDelete');
    await confirmDeleteUser.click();

    // Verify the user is removed
    await expect(userList).not.toContainText(userName);
  });

  // 3. Test case: View user details after creating the user
  test('should create a user and view the details', async ({ page }) => {
    let userName = `Jane Doe-${randomInteger(1, 50)}`
    
    // Create the user
    await page.fill('#userName', userName);
    await page.fill('#initialBalance', '1500');
    await page.click('#createUser');

    // Wait for the user to be added to the table
    const userList = page.locator('#users-body');
    await expect(userList).toContainText(userName);

    // Fill the user ID to view the details
    const userIdLocator = userList.locator('tr', { hasText: userName }).locator('td:first-child');
    const userId = await userIdLocator.innerText();

    // Click the "Single User View" tab
    await page.click('#tab-user-view a');
    
    await page.fill('#singleUserId', userId);
    await page.click('#viewUser');

    // Wait for user details to appear
    const userDetails = page.locator('#user-details');
    await expect(userDetails).toBeVisible();
    await expect(userDetails.locator('#user-name')).toContainText(userName);
    await expect(userDetails.locator('#user-balance')).toContainText('1500');
  });

  // 4. Test case: Create a transaction and verify it's added
  test('should create a transaction and display in the transaction list', async ({ page }) => {
    let userNameOne = `User One-${randomInteger(1, 50)}`
    let userNameTwo = `User Two-${randomInteger(1, 50)}`

    // Create two users first
    await page.fill('#userName', userNameOne);
    await page.fill('#initialBalance', '2000');
    await page.click('#createUser');
    await page.fill('#userName', userNameTwo);
    await page.fill('#initialBalance', '3000');
    await page.click('#createUser');

    // Get the User IDs of the two created users
    const userList = page.locator('#users-body');
    const userOneId = await userList.locator('tr', { hasText: userNameOne }).locator('td:first-child').innerText();
    const userTwoId = await userList.locator('tr', { hasText: userNameTwo }).locator('td:first-child').innerText();

    // Switch to the Transactions tab
    await page.click('#tab-transactions a');

    // Fill the transaction form
    await page.fill('#fromUserId', userOneId);
    await page.fill('#toUserId', userTwoId);
    await page.fill('#amount', '500');
    await page.click('#submitTransaction');

    // Verify transaction is in the history
    const transactionList = page.locator('#transactions-body');
    await expect(transactionList).toContainText(userOneId);
    await expect(transactionList).toContainText(userTwoId);
    await expect(transactionList).toContainText('500');
  });

  // 5. Test case: Delete a created user
  test('should delete a user from the user list', async ({ page }) => {
    // Create a user
    await page.fill('#userName', 'Delete Me');
    await page.fill('#initialBalance', '500');
    await page.click('#createUser');

    // Wait for the user to be added to the table
    const userList = page.locator('#users-body');
    await expect(userList).toContainText('Delete Me');

    // Find the delete button for this user and click it
    const deleteButton = userList.locator('tr', { hasText: 'Delete Me' }).locator('#delete-user');
    await deleteButton.click();

    // Find the confirmation delete button and click it
    const confirmDeleteUser = page.locator('#confirmDelete');
    await confirmDeleteUser.click();

    // Verify the user is removed
    await expect(userList).not.toContainText('Delete Me');
  });
});
