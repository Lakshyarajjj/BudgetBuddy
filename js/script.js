// 1. Application data

const appName = "BudgetBuddy";
let studentName = "Student";
let balance = 10000;
let totalExpenses = 2500;
let monthlyBudget = 15000;

// 2. Display application information

console.log("Welcome to " + appName);
console.log("Student: " + studentName);

// 3. Calculate remaining balance

function calculateBalance(currentBalance, expenseAmount) {
  return currentBalance - expenseAmount;
}

// 4. Calculate budget remaining

function calculateRemainingBudget(budget, expenses) {
  return budget - expenses;
}

// 5. Calculate total expenses

function calculateExpense(expense1, expense2) {
  return expense1 + expense2;
}

// 6. Is budget exceeded

function isBudgetExceeded(budget, expenses) {
  return expenses > budget;
}

// 7. Test calculations

let newBalance = calculateBalance(balance, 150);
let remainingBudget = calculateRemainingBudget(monthlyBudget, totalExpenses);

console.log(`New Balance: ₹${newBalance}`);
console.log(`Remaining Budget: ₹${remainingBudget}`);
console.log(calculateExpense(150, 200));
console.log(isBudgetExceeded(15000, 16000));
console.log(isBudgetExceeded(15000, 12000));



const expenseForm = document.querySelector(".expense-form");

const expenseDate = document.querySelector("#expense-date");

const expenseCategory = document.querySelector("#category-select");

const expenseName = document.querySelector("#expense-name");

const expenseAmount = document.querySelector("#expense-amount");

const currentBalanceElement = document.querySelector("#current-balance");
const totalExpensesElement = document.querySelector("#total-expenses");
const monthlyBudgetElement = document.querySelector("#monthly-budget");


const transactionList = document.querySelector("#transaction-list");


if (expenseForm && transactionList) {
  expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // 1. Capture form values
    const date = expenseDate.value;
    const category = expenseCategory.value;
    const name = expenseName.value;
    const amount = Number(expenseAmount.value);

    // 2. Validate amount
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    // 3. Remove empty message
    const emptyMessage = transactionList.querySelector("p");

    if (emptyMessage) {
      emptyMessage.remove();
    }

    // 4. Create transaction
    const transaction = document.createElement("div");
    transaction.classList.add("transaction-item");

    const transactionDetails = document.createElement("div");

    const expenseTitle = document.createElement("h3");
    expenseTitle.textContent = name;

    const expenseInfo = document.createElement("p");
    expenseInfo.textContent = `${date} | ${category}`;

    const expenseValue = document.createElement("strong");
    expenseValue.textContent = `- ₹${amount}`;

    transactionDetails.appendChild(expenseTitle);
    transactionDetails.appendChild(expenseInfo);

    transaction.appendChild(transactionDetails);
    transaction.appendChild(expenseValue);

    transactionList.appendChild(transaction);

    // 5. Clear form
    expenseForm.reset();
  });
} else {
  console.error("Required HTML elements not found!");
}
