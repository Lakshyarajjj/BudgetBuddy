"use strict";

/* =========================================
   BUDGETBUDDY 3.0
   Student Finance Management Application
========================================= */

const STORAGE_KEY = "budgetBuddyV3";
const QUEST_KEY = "budgetBuddyQuestV3";

const $ = (id) => document.getElementById(id);

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const monthKey = (date) => String(date || "").slice(0, 7);
const currentMonth = () => today().slice(0, 7);
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const sum = (list) =>
  list.reduce((total, item) => total + Number(item.amount || 0), 0);

const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );

const defaultData = {
  name: "Student",
  openingBalance: 0,
  monthlyBudget: 15000,
  expenses: [],
  incomes: [],
  goals: [],
  recurring: [],
  theme: "dark",
};

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!saved || typeof saved !== "object") {
      return structuredClone(defaultData);
    }

    return {
      ...structuredClone(defaultData),
      ...saved,
      expenses: Array.isArray(saved.expenses) ? saved.expenses : [],
      incomes: Array.isArray(saved.incomes) ? saved.incomes : [],
      goals: Array.isArray(saved.goals) ? saved.goals : [],
      recurring: Array.isArray(saved.recurring) ? saved.recurring : [],
    };
  } catch {
    return structuredClone(defaultData);
  }
}

let data = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* =========================================
   FINANCIAL CALCULATIONS
========================================= */

// FIX 1:
// Savings goals store their contributed amount
// in the "saved" property, not the "amount" property.

function totalSaved() {
  return data.goals.reduce((total, goal) => total + Number(goal.saved || 0), 0);
}

// FIX 2:
// Do not add an invisible default opening balance.
// Available balance is based on tracked income,
// expenses and savings contributions.

function totals() {
  const income = sum(data.incomes);
  const expenses = sum(data.expenses);
  const savings = totalSaved();

  return {
    income,
    expenses,
    savings,
    balance: income - expenses - savings,
  };
}

function monthExpenses(month = currentMonth()) {
  return data.expenses.filter((item) => monthKey(item.date) === month);
}

function monthIncome(month = currentMonth()) {
  return data.incomes.filter((item) => monthKey(item.date) === month);
}

function monthSpent(month = currentMonth()) {
  return sum(monthExpenses(month));
}

function toast(message) {
  const element = $("toast");
  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => element.classList.remove("show"), 2800);
}

/* =========================================
   NAVIGATION
========================================= */

function navigate(page) {
  const target = $("page-" + page);
  if (!target) return;

  document
    .querySelectorAll(".page")
    .forEach((section) => section.classList.remove("active"));

  target.classList.add("active");

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  if (page === "analytics") renderAnalytics();
  if (page === "insights") renderInsights();
  if (page === "calendar") renderCalendar();
  if (page === "quest") renderQuest();

  window.location.hash = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", () => {
    navigate(button.dataset.page);
  });
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    if (
      button.dataset.action === "quick-expense" ||
      button.dataset.action === "focus-expense"
    ) {
      navigate("expenses");
      setTimeout(() => $("expense-title").focus(), 100);
    }
  });
});

/* =========================================
   GAMIFICATION ENGINE
========================================= */

const questDefaults = {
  xp: 0,
  streak: 0,
  lastActive: "",
  activityDays: [],
  expensesLogged: 0,
  incomeLogged: 0,
  goalsCreated: 0,
  analyticsVisits: 0,
  missionWeek: "",
  missionProgress: {},
  completedMissions: [],
  rewards: [],
};

function loadQuest() {
  try {
    return {
      ...questDefaults,
      ...JSON.parse(localStorage.getItem(QUEST_KEY)),
    };
  } catch {
    return { ...questDefaults };
  }
}

let quest = loadQuest();

function saveQuest() {
  localStorage.setItem(QUEST_KEY, JSON.stringify(quest));
}

function weekKey() {
  const d = new Date();
  const first = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - first) / 86400000 + first.getDay() + 1) / 7);

  return `${d.getFullYear()}-W${week}`;
}

const missions = [
  {
    id: "expenses",
    title: "Expense Tracker",
    description: "Record 5 expenses this week.",
    icon: "🧾",
    target: 5,
  },
  {
    id: "income",
    title: "Money Maker",
    description: "Record 2 income transactions.",
    icon: "💸",
    target: 2,
  },
  {
    id: "goals",
    title: "Future Investor",
    description: "Create a savings goal.",
    icon: "🎯",
    target: 1,
  },
  {
    id: "analytics",
    title: "Financial Detective",
    description: "Review your analytics.",
    icon: "🔍",
    target: 1,
  },
];

const badgeDefinitions = [
  {
    id: "first-expense",
    name: "First Step",
    description: "Record your first expense.",
    icon: "🧾",
    check: () => quest.expensesLogged >= 1,
  },
  {
    id: "ten-expenses",
    name: "Expense Pro",
    description: "Record 10 expenses.",
    icon: "💳",
    check: () => quest.expensesLogged >= 10,
  },
  {
    id: "five-income",
    name: "Money Maker",
    description: "Record 5 income entries.",
    icon: "💰",
    check: () => quest.incomeLogged >= 5,
  },
  {
    id: "first-goal",
    name: "Dream Builder",
    description: "Create a savings goal.",
    icon: "🎯",
    check: () => quest.goalsCreated >= 1,
  },
  {
    id: "three-goals",
    name: "Goal Getter",
    description: "Create 3 savings goals.",
    icon: "🏆",
    check: () => quest.goalsCreated >= 3,
  },
  {
    id: "hundred-xp",
    name: "XP Hunter",
    description: "Earn 100 XP.",
    icon: "⚡",
    check: () => quest.xp >= 100,
  },
  {
    id: "streak-three",
    name: "Consistency King",
    description: "Reach a 3-day streak.",
    icon: "🔥",
    check: () => quest.streak >= 3,
  },
  {
    id: "streak-seven",
    name: "Unstoppable",
    description: "Reach a 7-day streak.",
    icon: "👑",
    check: () => quest.streak >= 7,
  },
];

function addXP(amount, message) {
  quest.xp += amount;

  saveQuest();
  toast(`+${amount} XP — ${message}`);

  renderQuest();
  checkBadges();
}

function markActive() {
  const current = today();

  if (quest.lastActive === current) return;

  const previousDate = new Date();
  previousDate.setDate(previousDate.getDate() - 1);

  const yesterday = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, "0")}-${String(previousDate.getDate()).padStart(2, "0")}`;

  quest.streak = quest.lastActive === yesterday ? quest.streak + 1 : 1;

  quest.lastActive = current;

  quest.activityDays = [...new Set([...quest.activityDays, current])].slice(
    -60,
  );

  saveQuest();
  addXP(10, "Daily activity bonus!");
}

function resetMissions() {
  const week = weekKey();

  if (quest.missionWeek !== week) {
    quest.missionWeek = week;
    quest.missionProgress = {};
    quest.completedMissions = [];

    saveQuest();
  }
}

function progressMission(id) {
  resetMissions();

  const mission = missions.find((item) => item.id === id);

  if (!mission || quest.completedMissions.includes(id)) {
    return;
  }

  quest.missionProgress[id] = Math.min(
    mission.target,
    (Number(quest.missionProgress[id]) || 0) + 1,
  );

  if (quest.missionProgress[id] >= mission.target) {
    quest.completedMissions.push(id);
    saveQuest();

    addXP(50, `Mission completed: ${mission.title}`);
  } else {
    saveQuest();
    renderQuest();
  }
}

function checkBadges() {
  badgeDefinitions.forEach((badge) => {
    if (!quest.rewards.includes(badge.id) && badge.check()) {
      quest.rewards.push(badge.id);
      saveQuest();

      toast(`🏆 Achievement unlocked: ${badge.name}`);
    }
  });

  renderBadges();
}

function levelInfo() {
  const level = Math.floor(quest.xp / 100) + 1;
  const progress = quest.xp % 100;

  let rank = "🌱 Beginner";

  if (level >= 20) rank = "👑 Money Master";
  else if (level >= 15) rank = "💎 Wealth Wizard";
  else if (level >= 10) rank = "🚀 Finance Legend";
  else if (level >= 5) rank = "🔥 Budget Champion";
  else if (level >= 3) rank = "⚡ Smart Spender";

  return { level, progress, rank };
}

function renderQuest() {
  const level = levelInfo();

  const values = {
    "quest-level-badge": `LEVEL ${level.level}`,
    "quest-player-name": data.name || "Money Rookie",
    "quest-rank": level.rank,
    "quest-xp": `${quest.xp} XP`,
    "quest-total-xp": quest.xp.toLocaleString("en-IN"),
    "quest-next-xp": `${100 - level.progress} XP to next level`,
    "quest-streak": `${quest.streak} days`,
    "quest-streak-large": `${quest.streak} days`,
    "quest-achievement-count": quest.rewards.length,
  };

  Object.entries(values).forEach(([id, value]) => {
    if ($(id)) $(id).textContent = value;
  });

  if ($("quest-xp-progress")) {
    $("quest-xp-progress").style.width = `${level.progress}%`;
  }

  if ($("quest-streak-message")) {
    $("quest-streak-message").textContent =
      quest.lastActive === today()
        ? "✅ You're active today. Come back tomorrow to continue your streak!"
        : "Complete a financial activity today to start or continue your streak.";
  }

  renderMissions();
  renderBadges();
  renderLeaderboard();
}

function renderMissions() {
  const container = $("quest-missions");
  if (!container) return;

  resetMissions();

  container.innerHTML = missions
    .map((mission) => {
      const progress = Number(quest.missionProgress[mission.id]) || 0;

      const completed = quest.completedMissions.includes(mission.id);

      const percent = (progress / mission.target) * 100;

      return `
      <article class="quest-mission ${completed ? "quest-complete" : ""}">
        <div class="quest-mission-top">
          <div>
            <h3>${mission.icon} ${escapeHTML(mission.title)}</h3>
            <p>${mission.description}</p>
          </div>
          <span class="quest-mission-xp">${completed ? "✓ COMPLETE" : "+50 XP"}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${percent}%"></div>
        </div>
        <div class="quest-mission-footer">
          <span>${progress}/${mission.target}</span>
          <span>${completed ? "Mission cleared!" : "Keep going!"}</span>
        </div>
      </article>`;
    })
    .join("");
}

function renderBadges() {
  const container = $("quest-badges");
  if (!container) return;

  container.innerHTML = badgeDefinitions
    .map((badge) => {
      const unlocked = quest.rewards.includes(badge.id);

      return `
      <article class="quest-badge ${unlocked ? "unlocked" : ""}">
        <div class="quest-badge-icon">${badge.icon}</div>
        <strong>${escapeHTML(badge.name)}</strong>
        <small>${escapeHTML(badge.description)}</small>
        <small>${unlocked ? "UNLOCKED ✓" : "LOCKED"}</small>
      </article>`;
    })
    .join("");

  if ($("quest-achievement-count")) {
    $("quest-achievement-count").textContent = quest.rewards.length;
  }
}

function renderLeaderboard() {
  const container = $("quest-leaderboard");
  if (!container) return;

  const players = [
    { name: "PixelPanda", xp: 1250, avatar: "🐼" },
    { name: "CashFlowKid", xp: 980, avatar: "🦊" },
    { name: "TheSaver", xp: 760, avatar: "🐸" },
    { name: "BudgetBoss", xp: 550, avatar: "🦁" },
    {
      name: data.name || "You",
      xp: quest.xp,
      avatar: "🐧",
      you: true,
    },
  ].sort((a, b) => b.xp - a.xp);

  container.innerHTML = players
    .map(
      (player, index) => `
    <div class="quest-player ${player.you ? "you" : ""}">
      <span class="quest-player-rank">
        ${["🥇", "🥈", "🥉"][index] || "#" + (index + 1)}
      </span>
      <span class="quest-player-avatar">${player.avatar}</span>
      <div class="quest-player-info">
        <strong>${escapeHTML(player.name)}${player.you ? " (You)" : ""}</strong>
        <small>${player.you ? "Your real XP" : "Demo player"}</small>
      </div>
      <span class="quest-player-xp">
        ${player.xp.toLocaleString("en-IN")} XP
      </span>
    </div>`,
    )
    .join("");
}

/* =========================================
   TRANSACTION HELPERS
========================================= */

function createTransaction(type, values) {
  const transaction = {
    id: uid(),
    title: values.title.trim(),
    amount: Number(values.amount),
    category: values.category,
    date: values.date,
    notes: values.notes || "",
  };

  if (
    !transaction.title ||
    !Number.isFinite(transaction.amount) ||
    transaction.amount <= 0
  ) {
    toast("Enter a valid title and amount.");
    return false;
  }

  if (!transaction.date) {
    toast("Please select a date.");
    return false;
  }

  if (type === "expense") {
    data.expenses.unshift(transaction);
  } else {
    data.incomes.unshift(transaction);
  }

  saveData();
  markActive();

  if (type === "expense") {
    quest.expensesLogged++;

    addXP(10, "Expense recorded!");
    progressMission("expenses");
  } else {
    quest.incomeLogged++;

    addXP(10, "Income recorded!");
    progressMission("income");
  }

  checkBadges();
  renderAll();

  return true;
}

function deleteTransaction(type, id) {
  if (!confirm("Delete this transaction?")) return;

  const key = type === "expense" ? "expenses" : "incomes";

  data[key] = data[key].filter((item) => item.id !== id);

  saveData();
  renderAll();

  toast("Transaction deleted.");
}

function transactionHTML(item, type) {
  const isIncome = type === "income";

  const iconMap = {
    Food: "🍔",
    Travel: "🚕",
    Shopping: "🛍️",
    Education: "📚",
    Entertainment: "🎮",
    Health: "💊",
    Bills: "🧾",
    Other: "💳",
    Allowance: "💵",
    Salary: "💼",
    Freelancing: "💻",
    Scholarship: "🎓",
    Business: "📈",
    Gift: "🎁",
  };

  return `
    <div class="transaction">
      <div class="transaction-icon">
        ${iconMap[item.category] || "💳"}
      </div>

      <div class="transaction-info">
        <strong>${escapeHTML(item.title)}</strong>
        <small>
          ${escapeHTML(item.category)} · ${escapeHTML(item.date)}
        </small>
      </div>

      <strong class="transaction-amount ${isIncome ? "positive" : "negative"}">
        ${isIncome ? "+" : "-"}${money(item.amount)}
      </strong>

      <div class="transaction-actions">
        <button
          data-edit="${escapeHTML(item.id)}"
          data-type="${type}"
          title="Edit"
        >✏️</button>

        <button
          data-delete="${escapeHTML(item.id)}"
          data-type="${type}"
          title="Delete"
        >🗑️</button>
      </div>
    </div>`;
}

function renderTransactionList(containerId, list, type) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = list.length
    ? list.map((item) => transactionHTML(item, type)).join("")
    : `
      <div class="empty-state">
        <span>🪙</span>
        No transactions yet. Start tracking your money!
      </div>`;
}

/* =========================================
   DASHBOARD
========================================= */

function renderDashboard() {
  const total = totals();

  const spent = monthSpent();
  const budget = Number(data.monthlyBudget) || 0;

  const remaining = budget - spent;

  const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  $("dashboard-balance").textContent = money(total.balance);

  $("dashboard-income").textContent = money(total.income);

  $("dashboard-expenses").textContent = money(total.expenses);

  $("dashboard-saved").textContent = money(total.savings);

  $("dash-budget").textContent = money(budget);

  $("dash-month-spent").textContent = money(spent);

  $("dash-remaining").textContent = money(remaining);

  $("dash-goals").textContent = data.goals.length;

  $("budget-percent").textContent = `${Math.round(percent)}%`;

  $("budget-circle").style.background =
    `conic-gradient(var(--purple) ${percent * 3.6}deg,var(--surface-3) 0deg)`;

  $("budget-overview-text").textContent = budget
    ? `${money(spent)} spent`
    : "No budget set";

  $("budget-overview-caption").textContent = budget
    ? `${money(Math.max(0, remaining))} remaining this month`
    : "Create a budget to track your spending.";

  const recent = [
    ...data.expenses.map((item) => ({
      ...item,
      type: "expense",
    })),
    ...data.incomes.map((item) => ({
      ...item,
      type: "income",
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 5);

  $("recent-transactions").innerHTML = recent.length
    ? recent.map((item) => transactionHTML(item, item.type)).join("")
    : `
        <div class="empty-state">
          <span>✨</span>
          Your recent activity will appear here.
        </div>`;

  const recurring = data.recurring.slice(0, 4);

  $("dashboard-recurring").innerHTML = recurring.length
    ? recurring
        .map(
          (item) => `
              <div class="simple-item">
                <span>${escapeHTML(item.title)}</span>
                <strong>${money(item.amount)}</strong>
              </div>`,
        )
        .join("")
    : `<p class="muted">No upcoming payments added.</p>`;

  $("penny-message").textContent =
    total.balance < 0
      ? "Your spending is higher than your available funds. Review your transactions."
      : percent >= 90 && budget
        ? "You're close to your monthly budget. Keep an eye on your spending!"
        : "Every rupee you track is a step towards financial freedom.";
}

/* =========================================
   EXPENSES AND INCOME
========================================= */

function renderExpenses() {
  $("expense-total").textContent = money(sum(data.expenses));

  $("expense-month-total").textContent = money(monthSpent());

  const search = ($("expense-search").value || "").toLowerCase();

  const category = $("expense-filter").value;
  const sort = $("expense-sort").value;

  let list = data.expenses.filter(
    (item) =>
      item.title.toLowerCase().includes(search) &&
      (category === "all" || item.category === category),
  );

  if (sort === "newest") {
    list.sort((a, b) => b.date.localeCompare(a.date));
  }

  if (sort === "oldest") {
    list.sort((a, b) => a.date.localeCompare(b.date));
  }

  if (sort === "high") {
    list.sort((a, b) => b.amount - a.amount);
  }

  if (sort === "low") {
    list.sort((a, b) => a.amount - b.amount);
  }

  renderTransactionList("expense-list", list, "expense");
}

function renderIncome() {
  $("income-total").textContent = money(sum(data.incomes));

  renderTransactionList("income-list", data.incomes, "income");
}

$("expense-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const success = createTransaction("expense", {
    title: $("expense-title").value,
    amount: $("expense-amount").value,
    category: $("expense-category").value,
    date: $("expense-date").value,
    notes: $("expense-notes").value,
  });

  if (success) {
    event.target.reset();
    $("expense-date").value = today();

    toast("Expense added successfully!");
  }
});

$("income-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const success = createTransaction("income", {
    title: $("income-title").value,
    amount: $("income-amount").value,
    category: $("income-category").value,
    date: $("income-date").value,
  });

  if (success) {
    event.target.reset();
    $("income-date").value = today();

    toast("Income added successfully!");
  }
});

$("expense-search").addEventListener("input", renderExpenses);

$("expense-filter").addEventListener("change", renderExpenses);

$("expense-sort").addEventListener("change", renderExpenses);

/* =========================================
   TRANSACTION EDITING
========================================= */

document.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit]");
  const remove = event.target.closest("[data-delete]");

  if (edit) {
    const type = edit.dataset.type;

    const key = type === "expense" ? "expenses" : "incomes";

    const item = data[key].find((entry) => entry.id === edit.dataset.edit);

    if (!item) return;

    $("edit-id").value = item.id;
    $("edit-type").value = type;
    $("edit-title").value = item.title;
    $("edit-amount").value = item.amount;
    $("edit-category").value = item.category;
    $("edit-date").value = item.date;

    $("edit-modal").classList.add("open");
  }

  if (remove) {
    deleteTransaction(remove.dataset.type, remove.dataset.delete);
  }
});

$("close-modal").addEventListener("click", () => {
  $("edit-modal").classList.remove("open");
});

$("edit-modal").addEventListener("click", (event) => {
  if (event.target === $("edit-modal")) {
    $("edit-modal").classList.remove("open");
  }
});

$("edit-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const type = $("edit-type").value;

  const key = type === "expense" ? "expenses" : "incomes";

  const item = data[key].find((entry) => entry.id === $("edit-id").value);

  if (!item) return;

  const amount = Number($("edit-amount").value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return toast("Enter a valid amount.");
  }

  item.title = $("edit-title").value.trim();
  item.amount = amount;
  item.category = $("edit-category").value.trim();
  item.date = $("edit-date").value;

  saveData();

  $("edit-modal").classList.remove("open");

  renderAll();

  toast("Transaction updated.");
});

/* =========================================
   BUDGET
========================================= */

$("budget-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number($("budget-amount").value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return toast("Enter a valid budget.");
  }

  data.monthlyBudget = amount;

  saveData();
  renderAll();

  toast("Monthly budget updated!");
});

function renderBudget() {
  const budget = Number(data.monthlyBudget) || 0;
  const spent = monthSpent();

  const left = budget - spent;

  const percent = budget ? (spent / budget) * 100 : 0;

  $("budget-amount").value = budget || "";

  $("budget-detail-total").textContent = money(budget);

  $("budget-detail-spent").textContent = money(spent);

  $("budget-detail-left").textContent = money(left);

  $("budget-progress").style.width = `${Math.min(100, percent)}%`;

  $("budget-status").textContent = !budget
    ? "Not configured"
    : percent > 100
      ? "Over budget"
      : percent >= 80
        ? "Near limit"
        : "On track";

  $("budget-warning").textContent = !budget
    ? "Set your budget to begin tracking."
    : percent > 100
      ? `You exceeded your budget by ${money(spent - budget)}.`
      : percent >= 80
        ? "You're approaching your budget limit. Be careful with additional spending."
        : `You have ${money(left)} available in this month's budget.`;

  const categories = {};

  monthExpenses().forEach((item) => {
    categories[item.category] =
      (categories[item.category] || 0) + Number(item.amount);
  });

  const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  $("budget-category-list").innerHTML = entries.length
    ? entries
        .map(
          ([name, value]) => `
              <div class="category-row">
                <div class="category-meta">
                  <span>${escapeHTML(name)}</span>
                  <strong>${money(value)}</strong>
                </div>
                <div class="category-track">
                  <div style="width:${spent ? (value / spent) * 100 : 0}%"></div>
                </div>
              </div>`,
        )
        .join("")
    : `<div class="empty-state">No spending recorded this month.</div>`;
}

/* =========================================
   ANALYTICS
========================================= */

function renderAnalytics() {
  const month = $("analytics-month").value || currentMonth();

  const expenses = monthExpenses(month);
  const incomes = monthIncome(month);

  const expenseTotal = sum(expenses);
  const incomeTotal = sum(incomes);

  $("analytics-income").textContent = money(incomeTotal);

  $("analytics-expenses").textContent = money(expenseTotal);

  $("analytics-net").textContent = money(incomeTotal - expenseTotal);

  const categories = {};

  expenses.forEach((item) => {
    categories[item.category] =
      (categories[item.category] || 0) + Number(item.amount);
  });

  const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  const max = Math.max(1, ...entries.map((entry) => entry[1]));

  $("analytics-categories").innerHTML = entries.length
    ? entries
        .map(
          ([name, value]) => `
              <div class="category-row">
                <div class="category-meta">
                  <span>${escapeHTML(name)}</span>
                  <strong>${money(value)}</strong>
                </div>
                <div class="category-track">
                  <div style="width:${(value / max) * 100}%"></div>
                </div>
              </div>`,
        )
        .join("")
    : `<div class="empty-state">No data for this month.</div>`;

  $("analytics-chart").innerHTML = entries.length
    ? entries
        .slice(0, 6)
        .map(
          ([name, value]) => `
              <div class="bar-row">
                <span>${escapeHTML(name)}</span>
                <div class="bar-track">
                  <div style="width:${(value / max) * 100}%"></div>
                </div>
                <strong>${Math.round((value / max) * 100)}%</strong>
              </div>`,
        )
        .join("")
    : `<div class="empty-state">Your chart will appear here.</div>`;

  const months = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();

    d.setDate(1);
    d.setMonth(d.getMonth() - i);

    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-IN", {
        month: "short",
      }),
    });
  }

  const values = months.map((m) => sum(monthExpenses(m.key)));

  const maxValue = Math.max(1, ...values);

  $("monthly-trend").innerHTML = months
    .map(
      (m, index) => `
        <div class="trend-column">
          <div
            class="trend-bar"
            style="height:${Math.max(3, (values[index] / maxValue) * 115)}px"
          ></div>
          <small>${m.label}</small>
        </div>`,
    )
    .join("");
}

$("analytics-month").addEventListener("change", renderAnalytics);

/* =========================================
   AI-STYLE MONEY INSIGHTS
========================================= */

function renderInsights() {
  const expenses = monthExpenses();

  const total = sum(expenses);

  const average = expenses.length ? total / expenses.length : 0;

  const categories = {};

  expenses.forEach((item) => {
    categories[item.category] =
      (categories[item.category] || 0) + Number(item.amount);
  });

  const top = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

  const budget = Number(data.monthlyBudget) || 0;

  let score = 50;

  if (budget) {
    const ratio = total / budget;

    score =
      ratio <= 0.5
        ? 95
        : ratio <= 0.7
          ? 85
          : ratio <= 0.85
            ? 72
            : ratio <= 1
              ? 60
              : 35;
  }

  if (data.incomes.length > 0) {
    score = Math.min(100, score + 5);
  }

  if (data.goals.length > 0) {
    score = Math.min(100, score + 5);
  }

  if (expenses.length === 0) {
    score = 0;
  }

  $("health-score").textContent = score ? `${score}/100` : "--";

  $("score-value").textContent = score ? score : "--";

  $("health-label").textContent =
    score >= 80
      ? "Great financial habits!"
      : score >= 60
        ? "You're making progress."
        : "There is room to improve your money habits.";

  $("score-ring").style.borderColor =
    score >= 80 ? "#4adea7" : score >= 60 ? "#facc15" : "#fb7185";

  $("insight-top-category").textContent = top ? top[0] : "--";

  $("insight-average").textContent = money(average);

  $("insight-count").textContent = expenses.length;

  const insights = [];

  if (!expenses.length) {
    insights.push([
      "👋 Start tracking",
      "Add a few expenses to unlock personalized spending insights.",
    ]);
  } else {
    if (top) {
      insights.push([
        "📊 Your biggest category",
        `${top[0]} accounts for ${Math.round((top[1] / total) * 100)}% of your recorded monthly spending.`,
      ]);
    }

    if (budget) {
      const ratio = (total / budget) * 100;

      insights.push([
        "🎯 Budget check",
        `You have used ${ratio.toFixed(1)}% of your monthly budget.`,
      ]);
    } else {
      insights.push([
        "💡 Set a budget",
        "Create a monthly budget to understand how much you can safely spend.",
      ]);
    }

    if (average > 0) {
      insights.push([
        "🧮 Average transaction",
        `Your average expense this month is ${money(average)}.`,
      ]);
    }

    if (total > 0 && data.goals.length === 0) {
      insights.push([
        "🌱 Start saving",
        "Try creating a savings goal to give your money a purpose.",
      ]);
    }

    if (budget && total > budget) {
      insights.push([
        "⚠️ Spending alert",
        "Your expenses have exceeded your monthly budget. Review non-essential spending.",
      ]);
    }

    if (data.incomes.length === 0) {
      insights.push([
        "💵 Income tracking",
        "Record your allowance, scholarship or earnings for a more complete financial picture.",
      ]);
    }
  }

  $("insight-list").innerHTML = insights
    .map(
      ([title, description]) => `
        <div class="insight-item">
          <strong>${title}</strong>
          ${escapeHTML(description)}
        </div>`,
    )
    .join("");
}

/* =========================================
   SAVINGS GOALS
========================================= */

$("goal-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const target = Number($("goal-target").value);
  const initial = Number($("goal-initial").value) || 0;

  if (
    !Number.isFinite(target) ||
    target <= 0 ||
    initial < 0 ||
    initial > target
  ) {
    return toast("Check your savings amounts.");
  }

  data.goals.push({
    id: uid(),
    title: $("goal-title").value.trim(),
    target,
    saved: initial,
    date: $("goal-date").value,
  });

  saveData();

  quest.goalsCreated++;

  markActive();

  addXP(20, "Savings goal created!");

  progressMission("goals");
  checkBadges();

  event.target.reset();

  renderAll();

  toast("Savings goal created!");
});

function renderGoals() {
  // FIX: Calculate savings using each goal's saved property.
  const total = totalSaved();

  $("savings-total").textContent = `${money(total)} saved`;

  $("goals-list").innerHTML = data.goals.length
    ? data.goals
        .map((goal) => {
          const percent = Math.min(
            100,
            (Number(goal.saved || 0) / Number(goal.target || 1)) * 100,
          );

          return `
              <article class="goal-card">
                <p class="eyebrow">SAVINGS GOAL</p>

                <h3>${escapeHTML(goal.title)}</h3>

                <p class="muted">
                  ${
                    goal.date
                      ? `Target date: ${escapeHTML(goal.date)}`
                      : "No target date"
                  }
                </p>

                <div class="goal-progress">
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      style="width:${percent}%"
                    ></div>
                  </div>
                </div>

                <div class="goal-footer">
                  <span>${money(goal.saved)} saved</span>
                  <strong>${Math.round(percent)}%</strong>
                </div>

                <div class="goal-footer">
                  <span>Target: ${money(goal.target)}</span>
                  <span>${money(Math.max(0, goal.target - goal.saved))} left</span>
                </div>

                <div class="goal-actions">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Add amount"
                    id="contribute-${goal.id}"
                  >

                  <button
                    class="secondary-button"
                    data-contribute="${goal.id}"
                  >Add</button>

                  <button
                    class="danger-button"
                    data-goal-delete="${goal.id}"
                  >Delete</button>
                </div>
              </article>`;
        })
        .join("")
    : `
        <div class="empty-state">
          <span>🎯</span>
          Create your first savings goal.
        </div>`;
}

document.addEventListener("click", (event) => {
  const contribute = event.target.closest("[data-contribute]");

  const remove = event.target.closest("[data-goal-delete]");

  if (contribute) {
    const id = contribute.dataset.contribute;

    const goal = data.goals.find((item) => item.id === id);

    const input = $(`contribute-${id}`);
    const amount = Number(input.value);

    if (!goal || !Number.isFinite(amount) || amount <= 0) {
      return toast("Enter a valid contribution.");
    }

    if (totals().balance < amount) {
      return toast("Not enough available balance for this contribution.");
    }

    goal.saved += amount;

    saveData();

    markActive();

    addXP(5, "Savings contribution!");

    renderAll();

    toast("Savings contribution recorded.");
  }

  if (remove) {
    if (!confirm("Delete this savings goal?")) return;

    data.goals = data.goals.filter(
      (goal) => goal.id !== remove.dataset.goalDelete,
    );

    saveData();
    renderAll();

    toast("Savings goal deleted.");
  }
});

/* =========================================
   CALENDAR
========================================= */

let calendarDate = new Date();
let selectedCalendarDate = today();

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();

  $("calendar-month").textContent = calendarDate.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const cells = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
    (day) => `<div class="calendar-cell heading">${day}</div>`,
  );

  for (let i = 0; i < firstDay; i++) {
    cells.push(`<div class="calendar-cell"></div>`);
  }

  for (let day = 1; day <= days; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const hasExpense = data.expenses.some((item) => item.date === key);

    const hasIncome = data.incomes.some((item) => item.date === key);

    cells.push(`
      <div class="calendar-cell ${key === today() ? "today" : ""} ${
        key === selectedCalendarDate ? "selected" : ""
      }">
        <button data-calendar-date="${key}">
          ${day}
          <div class="calendar-dots">
            ${hasIncome ? "🟢" : ""}
            ${hasExpense ? "🔴" : ""}
          </div>
        </button>
      </div>`);
  }

  $("calendar-grid").innerHTML = cells.join("");

  renderCalendarTransactions();
}

function renderCalendarTransactions() {
  const items = [
    ...data.expenses
      .filter((item) => item.date === selectedCalendarDate)
      .map((item) => ({
        ...item,
        type: "expense",
      })),

    ...data.incomes
      .filter((item) => item.date === selectedCalendarDate)
      .map((item) => ({
        ...item,
        type: "income",
      })),
  ];

  $("calendar-transactions").innerHTML = items.length
    ? items.map((item) => transactionHTML(item, item.type)).join("")
    : `
        <div class="empty-state">
          No transactions on ${selectedCalendarDate}.
        </div>`;
}

$("calendar-prev").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);

  renderCalendar();
});

$("calendar-next").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);

  renderCalendar();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-calendar-date]");

  if (!button) return;

  selectedCalendarDate = button.dataset.calendarDate;

  renderCalendar();
  renderCalendarTransactions();
});

/* =========================================
   RECURRING PAYMENTS
========================================= */

$("recurring-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number($("recurring-amount").value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return toast("Enter a valid amount.");
  }

  data.recurring.unshift({
    id: uid(),
    title: $("recurring-title").value.trim(),
    amount,
    frequency: $("recurring-frequency").value,
    date: $("recurring-date").value,
  });

  saveData();

  markActive();

  addXP(10, "Recurring payment added!");

  event.target.reset();

  $("recurring-date").value = today();

  renderAll();
});

function renderRecurring() {
  $("recurring-list").innerHTML = data.recurring.length
    ? data.recurring
        .map(
          (item) => `
              <div class="transaction">
                <div class="transaction-icon">🔁</div>

                <div class="transaction-info">
                  <strong>${escapeHTML(item.title)}</strong>
                  <small>
                    ${escapeHTML(item.frequency)} · Due ${escapeHTML(item.date)}
                  </small>
                </div>

                <strong class="transaction-amount">
                  ${money(item.amount)}
                </strong>

                <div class="transaction-actions">
                  <button
                    data-record-recurring="${item.id}"
                    title="Record payment"
                  >✓</button>

                  <button
                    data-recurring-delete="${item.id}"
                    title="Delete"
                  >🗑️</button>
                </div>
              </div>`,
        )
        .join("")
    : `
        <div class="empty-state">
          No recurring payments yet.
        </div>`;
}

document.addEventListener("click", (event) => {
  const record = event.target.closest("[data-record-recurring]");

  const remove = event.target.closest("[data-recurring-delete]");

  if (record) {
    const item = data.recurring.find(
      (entry) => entry.id === record.dataset.recordRecurring,
    );

    if (!item) return;

    data.expenses.unshift({
      id: uid(),
      title: item.title,
      amount: item.amount,
      category: "Bills",
      date: today(),
      notes: "Recurring payment",
    });

    const date = new Date(item.date + "T00:00:00");

    if (item.frequency === "Weekly") {
      date.setDate(date.getDate() + 7);
    } else if (item.frequency === "Yearly") {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }

    item.date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    saveData();

    markActive();

    quest.expensesLogged++;

    addXP(10, "Recurring expense recorded!");

    progressMission("expenses");
    checkBadges();

    renderAll();

    toast("Payment recorded as an expense.");
  }

  if (remove) {
    data.recurring = data.recurring.filter(
      (item) => item.id !== remove.dataset.recurringDelete,
    );

    saveData();
    renderAll();

    toast("Recurring payment deleted.");
  }
});

/* =========================================
   PROFILE AND THEME
========================================= */

$("profile-form").addEventListener("submit", (event) => {
  event.preventDefault();

  data.name = $("profile-name").value.trim() || "Student";

  saveData();
  renderAll();

  toast("Profile updated.");
});

function applyTheme() {
  document.body.classList.toggle("light-theme", data.theme === "light");

  $("theme-toggle").textContent = data.theme === "light" ? "☀️" : "🌙";
}

$("theme-toggle").addEventListener("click", () => {
  data.theme = data.theme === "light" ? "dark" : "light";

  saveData();
  applyTheme();
});

$("profile-button").addEventListener("click", () => {
  navigate("settings");
});

/* =========================================
   CSV EXPORT AND BACKUP
========================================= */

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  anchor.click();

  URL.revokeObjectURL(url);
}

function exportCSV() {
  const rows = [
    ["Type", "Title", "Category", "Amount", "Date"],

    ...data.expenses.map((item) => [
      "Expense",
      item.title,
      item.category,
      item.amount,
      item.date,
    ]),

    ...data.incomes.map((item) => [
      "Income",
      item.title,
      item.category,
      item.amount,
      item.date,
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  downloadFile("budgetbuddy-transactions.csv", csv, "text/csv;charset=utf-8");

  toast("CSV exported.");
}

$("export-expenses").addEventListener("click", exportCSV);

$("export-all").addEventListener("click", exportCSV);

$("backup-data").addEventListener("click", () => {
  const backup = {
    data,
    quest,
    version: 3,
  };

  downloadFile(
    "budgetbuddy-backup.json",
    JSON.stringify(backup, null, 2),
    "application/json",
  );

  toast("Backup downloaded.");
});

$("restore-data").addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  try {
    const backup = JSON.parse(await file.text());

    if (
      !backup.data ||
      !Array.isArray(backup.data.expenses) ||
      !Array.isArray(backup.data.incomes)
    ) {
      throw new Error("Invalid backup");
    }

    if (
      !confirm("Restore this backup? Your current app data will be replaced.")
    ) {
      return;
    }

    data = {
      ...structuredClone(defaultData),
      ...backup.data,
    };

    if (backup.quest) {
      quest = {
        ...questDefaults,
        ...backup.quest,
      };
    }

    saveData();
    saveQuest();

    renderAll();
    applyTheme();

    toast("Backup restored.");
  } catch {
    toast("Invalid backup file.");
  } finally {
    event.target.value = "";
  }
});

/* =========================================
   RESET DATA
========================================= */

$("reset-data").addEventListener("click", () => {
  if (
    !confirm(
      "This permanently resets your BudgetBuddy data in this browser. Continue?",
    )
  ) {
    return;
  }

  if (
    !confirm(
      "Are you absolutely sure? Download a backup first if you need your data.",
    )
  ) {
    return;
  }

  data = structuredClone(defaultData);
  quest = { ...questDefaults };

  saveData();
  saveQuest();

  renderAll();
  applyTheme();

  toast("BudgetBuddy has been reset.");
});

/* =========================================
   RENDER EVERYTHING
========================================= */

function renderAll() {
  renderDashboard();
  renderExpenses();
  renderIncome();
  renderBudget();
  renderGoals();
  renderRecurring();
  renderQuest();

  $("profile-name").value = data.name;

  $("welcome-name").textContent = data.name;

  $("profile-button").textContent = (data.name || "S").charAt(0).toUpperCase();
}

/* =========================================
   INITIALIZATION
========================================= */

function initialize() {
  $("today-label").textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  $("welcome-date").textContent = new Date()
    .toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();

  $("expense-date").value = today();
  $("income-date").value = today();
  $("recurring-date").value = today();

  $("analytics-month").value = currentMonth();

  applyTheme();

  resetMissions();

  renderAll();

  const initialPage = window.location.hash.replace("#", "");

  if (initialPage && $("page-" + initialPage)) {
    navigate(initialPage);
  } else {
    navigate("dashboard");
  }

  console.log("BudgetBuddy 3.0 initialized successfully.");
}

initialize();
