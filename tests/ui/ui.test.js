const { test, expect } = require('@playwright/test');

// Get the BASE_URL from the environment or default to localhost:3000
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Banking App UI Tests', () => {

  // Before each test, go to the main page
  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  // 1. Test case: Check the page title
  test('should have the correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Banking App');
  });

  // 2. Test case: Create a user and check if it's added to the list
  test('should create a user and display in the user list', async ({ page }) => {
    // Fill the create user form
    await page.fill('#userName', 'John Doe');
    await page.fill('#initialBalance', '1000');
    await page.click('#createUser');

    // Wait for the user to be added to the table
    const userList = page.locator('#users-body');
    await expect(userList).toContainText('John Doe');
  });

  // 3. Test case: View user details after creating the user
  test('should create a user and view the details', async ({ page }) => {
    // Create the user
    await page.fill('#userName', 'Jane Doe');
    await page.fill('#initialBalance', '1500');
    await page.click('#createUser');

    // Wait for the user to be added to the table
    const userList = page.locator('#users-body');
    await expect(userList).toContainText('Jane Doe');

    // Click the "Single User View" tab
    await page.click('#tab-user-view a');

    // Fill the user ID to view the details (assuming user ID is accessible)
    const userIdLocator = userList.locator('tr', { hasText: 'Jane Doe' }).locator('td:first-child');
    const userId = await userIdLocator.innerText();
    await page.fill('#singleUserId', userId);
    await page.click('#viewUser');

    // Wait for user details to appear
    const userDetails = page.locator('#user-details');
    await expect(userDetails).toBeVisible();
    await expect(userDetails.locator('#user-name')).toContainText('Jane Doe');
    await expect(userDetails.locator('#user-balance')).toContainText('1500');
  });

  // 4. Test case: Create a transaction and verify it's added
  test('should create a transaction and display in the transaction list', async ({ page }) => {
    // Create two users first
    await page.fill('#userName', 'User One');
    await page.fill('#initialBalance', '2000');
    await page.click('#createUser');
    await page.fill('#userName', 'User Two');
    await page.fill('#initialBalance', '3000');
    await page.click('#createUser');

    // Get the User IDs of the two created users
    const userList = page.locator('#users-body');
    const userOneId = await userList.locator('tr', { hasText: 'User One' }).locator('td:first-child').innerText();
    const userTwoId = await userList.locator('tr', { hasText: 'User Two' }).locator('td:first-child').innerText();

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

    // Verify the user is removed
    await expect(userList).not.toContainText('Delete Me');
  });
});
