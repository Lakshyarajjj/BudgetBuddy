// ==================================================
// BUDGETBUDDY — STUDENT FINANCE MANAGER
// DAY 9: ADD, EDIT AND DELETE TRANSACTIONS
// ==================================================

// ==================================================
// 1. APPLICATION DATA
// ==================================================

const appName = "BudgetBuddy";
let studentName = "Student";

const initialBalance = 10000;
let monthlyBudget = 15000;

// Store all expense objects
let expenses = [];

// ==================================================
// 2. DISPLAY APPLICATION INFORMATION
// ==================================================

console.log("Welcome to " + appName);
console.log("Student: " + studentName);

// ==================================================
// 3. FINANCIAL CALCULATION FUNCTIONS
// ==================================================

function calculateBalance(currentBalance, expenseAmount) {
  return currentBalance - expenseAmount;
}

function calculateRemainingBudget(budget, totalExpenses) {
  return budget - totalExpenses;
}

function calculateExpense(expense1, expense2) {
  return expense1 + expense2;
}

function isBudgetExceeded(budget, totalExpenses) {
  return totalExpenses > budget;
}

// ==================================================
// 4. ARRAY METHODS
// ==================================================

// Calculate total expenses using reduce()

function calculateTotalExpenses() {
  return expenses.reduce(function (total, expense) {
    return total + expense.amount;
  }, 0);
}

// Filter expenses by category

function getExpensesByCategory(category) {
  return expenses.filter(function (expense) {
    return expense.category === category;
  });
}

// Find an expense by name

function findExpenseByName(name) {
  return expenses.find(function (expense) {
    return expense.name.toLowerCase() === name.toLowerCase();
  });
}

// Find expense index using findIndex()

function getExpenseIndex(id) {
  return expenses.findIndex(function (expense) {
    return expense.id === id;
  });
}

// ==================================================
// 5. SELECT HTML ELEMENTS
// ==================================================

const expenseForm = document.querySelector(".expense-form");

const expenseDate = document.querySelector("#expense-date");
const expenseCategory = document.querySelector("#category-select");
const expenseName = document.querySelector("#expense-name");
const expenseAmount = document.querySelector("#expense-amount");

const currentBalanceElement = document.querySelector("#current-balance");
const totalExpensesElement = document.querySelector("#total-expenses");
const monthlyBudgetElement = document.querySelector("#monthly-budget");

const remainingBudgetElement = document.querySelector("#remaining-budget");
const budgetWarningElement = document.querySelector("#budget-warning");

const transactionList = document.querySelector("#transaction-list");

// ==================================================
// 6. UPDATE DASHBOARD
// ==================================================

function updateDashboard() {
  // Calculate total expenses
  const totalExpenses = calculateTotalExpenses();

  // Calculate current balance
  const currentBalance = calculateBalance(initialBalance, totalExpenses);

  // Calculate remaining budget
  const remainingBudget = calculateRemainingBudget(
    monthlyBudget,
    totalExpenses,
  );

  // Update dashboard values
  currentBalanceElement.textContent = `₹${currentBalance}`;

  totalExpensesElement.textContent = `₹${totalExpenses}`;

  monthlyBudgetElement.textContent = `₹${monthlyBudget}`;

  remainingBudgetElement.textContent = `₹${remainingBudget}`;

  // Check budget status
  if (isBudgetExceeded(monthlyBudget, totalExpenses)) {
    budgetWarningElement.textContent =
      "Warning: You have exceeded your monthly budget!";
  } else {
    budgetWarningElement.textContent = "";
  }
}

// ==================================================
// 7. EDIT EXPENSE
// ==================================================

function editExpense(id) {
  // Find expense
  const expense = expenses.find(function (item) {
    return item.id === id;
  });

  if (!expense) {
    return;
  }

  // Ask for new expense name
  const newName = prompt("Enter expense name:", expense.name);

  if (newName === null || newName.trim() === "") {
    return;
  }

  // Ask for new expense amount
  const amountInput = prompt("Enter new amount:", expense.amount);

  if (amountInput === null) {
    return;
  }

  const newAmount = Number(amountInput);

  // Validate new amount
  if (!Number.isFinite(newAmount) || newAmount <= 0) {
    alert("Please enter a valid amount.");

    return;
  }

  // Update expense object
  expense.name = newName.trim();

  expense.amount = newAmount;

  // Refresh dashboard and transactions
  updateDashboard();

  displayTransactions();
}

// ==================================================
// 8. DELETE EXPENSE
// ==================================================

function deleteExpense(id) {
  // Confirm deletion
  const confirmed = confirm("Are you sure you want to delete this expense?");

  if (!confirmed) {
    return;
  }

  // Find expense index
  const index = getExpenseIndex(id);

  if (index === -1) {
    return;
  }

  // Remove expense from array
  expenses.splice(index, 1);

  // Refresh dashboard and transactions
  updateDashboard();

  displayTransactions();
}

// ==================================================
// 9. DISPLAY TRANSACTIONS
// ==================================================

function displayTransactions() {
  // Clear transaction list
  transactionList.textContent = "";

  // Show empty message if there are no expenses
  if (expenses.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.textContent =
      "No transactions yet. Start by adding an expense!";

    transactionList.appendChild(emptyMessage);

    return;
  }

  // Loop through all expenses
  expenses.forEach(function (expense) {
    // Create transaction container
    const transaction = document.createElement("div");

    transaction.classList.add("transaction-item");

    // Create transaction details
    const transactionDetails = document.createElement("div");

    // Create expense title
    const expenseTitle = document.createElement("h3");

    expenseTitle.textContent = expense.name;

    // Create expense information
    const expenseInfo = document.createElement("p");

    expenseInfo.textContent = `${expense.date} | ${expense.category}`;

    // Create expense amount
    const expenseValue = document.createElement("strong");

    expenseValue.textContent = `- ₹${expense.amount}`;

    // Create action buttons container
    const actionButtons = document.createElement("div");

    // Create edit button
    const editButton = document.createElement("button");

    editButton.textContent = "Edit";

    // Create delete button
    const deleteButton = document.createElement("button");

    deleteButton.textContent = "Delete";

    // Edit button event
    editButton.addEventListener("click", function () {
      editExpense(expense.id);
    });

    // Delete button event
    deleteButton.addEventListener("click", function () {
      deleteExpense(expense.id);
    });

    // Add buttons to action container
    actionButtons.appendChild(editButton);

    actionButtons.appendChild(deleteButton);

    // Add information to transaction details
    transactionDetails.appendChild(expenseTitle);

    transactionDetails.appendChild(expenseInfo);

    // Add details, amount and buttons to transaction
    transaction.appendChild(transactionDetails);

    transaction.appendChild(expenseValue);

    transaction.appendChild(actionButtons);

    // Add transaction to page
    transactionList.appendChild(transaction);
  });
}

// ==================================================
// 10. CHECK REQUIRED HTML ELEMENTS
// ==================================================

if (
  expenseForm &&
  expenseDate &&
  expenseCategory &&
  expenseName &&
  expenseAmount &&
  currentBalanceElement &&
  totalExpensesElement &&
  monthlyBudgetElement &&
  remainingBudgetElement &&
  budgetWarningElement &&
  transactionList
) {
  // Display initial dashboard
  updateDashboard();

  // Display initial transactions
  displayTransactions();

  // ==================================================
  // 11. HANDLE EXPENSE FORM SUBMISSION
  // ==================================================

  expenseForm.addEventListener("submit", function (event) {
    // Prevent page reload
    event.preventDefault();

    // ----------------------------------------------
    // STEP 1: CAPTURE FORM VALUES
    // ----------------------------------------------

    const date = expenseDate.value;

    const category = expenseCategory.value;

    const name = expenseName.value.trim();

    const amount = Number(expenseAmount.value);

    // ----------------------------------------------
    // STEP 2: VALIDATE INPUT
    // ----------------------------------------------

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      name === "" ||
      date === "" ||
      category === ""
    ) {
      alert("Please enter valid expense details.");

      return;
    }

    // ----------------------------------------------
    // STEP 3: CREATE EXPENSE OBJECT
    // ----------------------------------------------

    const expense = {
      id: Date.now(),

      date: date,

      category: category,

      name: name,

      amount: amount,
    };

    // ----------------------------------------------
    // STEP 4: STORE EXPENSE IN ARRAY
    // ----------------------------------------------

    expenses.push(expense);

    // ----------------------------------------------
    // STEP 5: UPDATE DASHBOARD
    // ----------------------------------------------

    updateDashboard();

    // ----------------------------------------------
    // STEP 6: DISPLAY TRANSACTIONS
    // ----------------------------------------------

    displayTransactions();

    // ----------------------------------------------
    // STEP 7: RESET FORM
    // ----------------------------------------------

    expenseForm.reset();

    // ----------------------------------------------
    // STEP 8: DISPLAY UPDATED DATA IN CONSOLE
    // ----------------------------------------------

    console.log("Updated Expenses:", expenses);
  });
} else {
  console.error("Required HTML elements not found!");
}

// ==================================================
// 12. APPLICATION INITIALIZATION
// ==================================================

console.log("BudgetBuddy loaded successfully.");
