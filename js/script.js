// ==================================================
// BUDGETBUDDY
// DAY 10: LOCAL STORAGE
// ==================================================

// 1. APPLICATION DATA

const appName = "BudgetBuddy";
let studentName = "Student";

const initialBalance = 10000;
let monthlyBudget = 15000;

let expenses = [];

// 2. DISPLAY APPLICATION INFORMATION

console.log("Welcome to " + appName);
console.log("Student: " + studentName);

// 3. SAVE EXPENSES TO LOCAL STORAGE

function saveExpenses() {
  const savedData = JSON.stringify(expenses);

  localStorage.setItem("budgetBuddyExpenses", savedData);

  console.log("Expenses saved successfully!");
}

// 4. LOAD EXPENSES FROM LOCAL STORAGE

function loadExpenses() {
  const savedData = localStorage.getItem("budgetBuddyExpenses");

  if (savedData !== null) {
    try {
      const loadedData = JSON.parse(savedData);

      if (Array.isArray(loadedData)) {
        expenses = loadedData;
      } else {
        expenses = [];
      }
    } catch (error) {
      console.error("Could not load saved expenses:", error);
      expenses = [];
    }
  }
}

// 5. FINANCIAL CALCULATIONS

function calculateBalance(currentBalance, expenseAmount) {
  return currentBalance - expenseAmount;
}

function calculateRemainingBudget(budget, totalExpenses) {
  return budget - totalExpenses;
}

function isBudgetExceeded(budget, totalExpenses) {
  return totalExpenses > budget;
}

function calculateTotalExpenses() {
  return expenses.reduce(function (total, expense) {
    return total + expense.amount;
  }, 0);
}

// 6. SELECT HTML ELEMENTS

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

// 7. UPDATE DASHBOARD

function updateDashboard() {
  const totalExpenses = calculateTotalExpenses();

  const currentBalance = calculateBalance(initialBalance, totalExpenses);

  const remainingBudget = calculateRemainingBudget(
    monthlyBudget,
    totalExpenses,
  );

  currentBalanceElement.textContent = `₹${currentBalance.toFixed(2)}`;

  totalExpensesElement.textContent = `₹${totalExpenses.toFixed(2)}`;

  monthlyBudgetElement.textContent = `₹${monthlyBudget.toFixed(2)}`;

  remainingBudgetElement.textContent = `₹${remainingBudget.toFixed(2)}`;

  if (isBudgetExceeded(monthlyBudget, totalExpenses)) {
    budgetWarningElement.textContent =
      "Warning: You have exceeded your monthly budget!";
  } else {
    budgetWarningElement.textContent = "";
  }
}

// 8. EDIT EXPENSE

function editExpense(id) {
  const expense = expenses.find(function (item) {
    return item.id === id;
  });

  if (!expense) return;

  const newName = prompt("Enter expense name:", expense.name);

  if (newName === null || newName.trim() === "") return;

  const amountInput = prompt("Enter new amount:", expense.amount);

  if (amountInput === null || amountInput.trim() === "") return;

  const newAmount = Number(amountInput);

  if (!Number.isFinite(newAmount) || newAmount <= 0) {
    alert("Please enter a valid amount.");

    return;
  }

  expense.name = newName.trim();
  expense.amount = newAmount;

  saveExpenses();

  updateDashboard();

  displayTransactions();
}

// 9. DELETE EXPENSE

function deleteExpense(id) {
  const confirmed = confirm("Are you sure you want to delete this expense?");

  if (!confirmed) return;

  const index = expenses.findIndex(function (expense) {
    return expense.id === id;
  });

  if (index === -1) return;

  expenses.splice(index, 1);

  saveExpenses();

  updateDashboard();

  displayTransactions();
}

// 10. DISPLAY TRANSACTIONS

function displayTransactions() {
  transactionList.textContent = "";

  if (expenses.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.textContent =
      "No transactions yet. Start by adding an expense!";

    transactionList.appendChild(emptyMessage);

    return;
  }

  expenses.forEach(function (expense) {
    const transaction = document.createElement("div");

    transaction.classList.add("transaction-item");

    const transactionDetails = document.createElement("div");

    const expenseTitle = document.createElement("h3");

    expenseTitle.textContent = expense.name;

    const expenseInfo = document.createElement("p");

    expenseInfo.textContent = `${expense.date} | ${expense.category}`;

    const expenseValue = document.createElement("strong");

    expenseValue.textContent = `- ₹${expense.amount.toFixed(2)}`;

    const actionButtons = document.createElement("div");

    const editButton = document.createElement("button");

    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");

    deleteButton.textContent = "Delete";

    editButton.addEventListener("click", function () {
      editExpense(expense.id);
    });

    deleteButton.addEventListener("click", function () {
      deleteExpense(expense.id);
    });

    actionButtons.appendChild(editButton);

    actionButtons.appendChild(deleteButton);

    transactionDetails.appendChild(expenseTitle);

    transactionDetails.appendChild(expenseInfo);

    transaction.appendChild(transactionDetails);

    transaction.appendChild(expenseValue);

    transaction.appendChild(actionButtons);

    transactionList.appendChild(transaction);
  });
}

// 11. CHECK REQUIRED HTML ELEMENTS

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
  // 12. LOAD PREVIOUSLY SAVED DATA

  loadExpenses();

  // 13. INITIALIZE DASHBOARD

  updateDashboard();

  displayTransactions();

  // 14. HANDLE FORM SUBMISSION

  expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const date = expenseDate.value;

    const category = expenseCategory.value;

    const name = expenseName.value.trim();

    const amount = Number(expenseAmount.value);

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

    const expense = {
      id: Date.now(),

      date: date,

      category: category,

      name: name,

      amount: amount,
    };

    expenses.push(expense);

    // Save updated expenses

    saveExpenses();

    // Refresh dashboard and transactions

    updateDashboard();

    displayTransactions();

    // Clear form

    expenseForm.reset();

    console.log("Updated Expenses:", expenses);
  });
} else {
  console.error("Required HTML elements not found!");
}

// 15. APPLICATION INITIALIZATION

console.log("BudgetBuddy loaded successfully.");
