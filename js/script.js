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