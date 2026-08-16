import { useState, useEffect } from "react";
import "./App.css";

function App() {
  // ==================================================
  // TRANSACTIONS
  // ==================================================

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==================================================
  // PAGE NAVIGATION
  // ==================================================

  const [activePage, setActivePage] = useState("dashboard");

  // ==================================================
  // TRANSACTION FORM
  // ==================================================

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "Food",
    amount: "",
    type: "expense",
  });

  // ==================================================
  // TRANSACTION FILTERS
  // ==================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // ==================================================
  // BUDGET STATE
  // ==================================================

  const [budgets, setBudgets] = useState([]);
  const [budgetLoading, setBudgetLoading] = useState(true);

  const [showBudgetForm, setShowBudgetForm] =
    useState(false);

  const [budgetForm, setBudgetForm] = useState({
    category: "Food",
    amount: "",
  });

  // ==================================================
  // ANALYTICS STATE
  // ==================================================

  const [analyticsPeriod, setAnalyticsPeriod] =
    useState("all");

  // ==================================================
  // SETTINGS STATE
  // ==================================================

  const [currency, setCurrency] = useState(
    () => localStorage.getItem("fintrack_currency") || "INR"
  );

  const [theme, setTheme] = useState(
    () => localStorage.getItem("fintrack_theme") || "light"
  );

  const [compactMode, setCompactMode] = useState(
    () => localStorage.getItem("fintrack_compact") === "true"
  );

  const currencySymbol =
    currency === "INR" ? "₹" :
    currency === "USD" ? "$" :
    currency === "EUR" ? "€" : "£";

  const money = (value) =>
    `${currencySymbol}${Number(value || 0).toLocaleString("en-IN")}`;

  useEffect(() => {
    localStorage.setItem("fintrack_currency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("fintrack_theme", theme);
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("fintrack_compact", compactMode);
  }, [compactMode]);

  // ==================================================
  // FETCH TRANSACTIONS
  // ==================================================

  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/transactions"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();

      setTransactions(data);
      setLoading(false);
    } catch (error) {
      console.error(
        "Error fetching transactions:",
        error
      );

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ==================================================
  // FETCH BUDGETS
  // ==================================================

  const fetchBudgets = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/budgets"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch budgets");
      }

      const data = await response.json();

      setBudgets(data);
      setBudgetLoading(false);
    } catch (error) {
      console.error(
        "Error fetching budgets:",
        error
      );

      setBudgetLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  // ==================================================
  // FINANCIAL SUMMARY
  // ==================================================

  const income = transactions
    .filter((item) => item.type === "income")
    .reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

  const balance = income - expenses;

  const savingsRate =
    income > 0
      ? Math.round((balance / income) * 100)
      : 0;

  // ==================================================
  // CATEGORY ICONS
  // ==================================================

  const categoryIcons = {
    Food: "🍔",
    Education: "🎓",
    Shopping: "🛍",
    Transport: "🚗",
    Entertainment: "🎬",
    Salary: "💰",
    Freelance: "💻",
    Other: "📦",
  };

  // ==================================================
  // SPENDING BREAKDOWN
  // ==================================================

  const spendingByCategory = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .reduce((categories, transaction) => {
      const category =
        transaction.category || "Other";

      if (!categories[category]) {
        categories[category] = 0;
      }

      categories[category] += Number(
        transaction.amount
      );

      return categories;
    }, {});

  const spendingData = Object.entries(
    spendingByCategory
  )
    .map(([category, amount]) => ({
      category,
      amount,
      percentage:
        expenses > 0
          ? Math.round((amount / expenses) * 100)
          : 0,
      icon:
        categoryIcons[category] || "📦",
    }))
    .sort(
      (a, b) => b.amount - a.amount
    );

  // ==================================================
  // ADD TRANSACTION
  // ==================================================

  const addTransaction = async (e) => {
    e.preventDefault();

    if (!form.title || !form.amount) {
      alert(
        "Please fill in all required fields"
      );
      return;
    }

    const newTransaction = {
      title: form.title,
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      date: new Date()
        .toISOString()
        .split("T")[0],
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            newTransaction
          ),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to add transaction"
        );
      }

      const savedTransaction =
        await response.json();

      setTransactions((prev) => [
        savedTransaction,
        ...prev,
      ]);

      setForm({
        title: "",
        category: "Food",
        amount: "",
        type: "expense",
      });

      setShowForm(false);
    } catch (error) {
      console.error(
        "Error adding transaction:",
        error
      );

      alert(
        "Could not add transaction. Please make sure the backend is running."
      );
    }
  };

  // ==================================================
  // DELETE TRANSACTION
  // ==================================================

  const deleteTransaction = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/transactions/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete transaction"
        );
      }

      setTransactions((prev) =>
        prev.filter(
          (transaction) =>
            transaction.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Error deleting transaction:",
        error
      );

      alert(
        "Could not delete transaction. Please make sure the backend is running."
      );
    }
  };

  // ==================================================
  // BUDGET CALCULATIONS
  // ==================================================

  const getCategorySpent = (category) => {
    return transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category === category
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      );
  };


  // ==================================================
  // ANALYTICS CALCULATIONS
  // ==================================================

  const analyticsTransactions = (() => {
    if (analyticsPeriod === "all") return transactions;

    const now = new Date();
    const days = analyticsPeriod === "7" ? 7 : 30;
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - days);

    return transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return !isNaN(date.getTime()) && date >= cutoff;
    });
  })();

  const analyticsIncome = analyticsTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const analyticsExpenses = analyticsTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const analyticsBalance = analyticsIncome - analyticsExpenses;

  const analyticsSavingsRate =
    analyticsIncome > 0
      ? Math.round((analyticsBalance / analyticsIncome) * 100)
      : 0;

  const analyticsCategoryData = Object.entries(
    analyticsTransactions
      .filter((item) => item.type === "expense")
      .reduce((acc, item) => {
        const category = item.category || "Other";
        acc[category] = (acc[category] || 0) + Number(item.amount);
        return acc;
      }, {})
  )
    .map(([category, amount]) => ({
      category,
      amount,
      percentage:
        analyticsExpenses > 0
          ? Math.round((amount / analyticsExpenses) * 100)
          : 0,
      icon: categoryIcons[category] || "📦",
    }))
    .sort((a, b) => b.amount - a.amount);

  const analyticsMonthlyData = (() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        income: 0,
        expense: 0,
      });
    }

    analyticsTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      if (isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const month = months.find((item) => item.key === key);

      if (!month) return;

      if (transaction.type === "income") {
        month.income += Number(transaction.amount);
      } else {
        month.expense += Number(transaction.amount);
      }
    });

    return months;
  })();

  const maxMonthlyValue = Math.max(
    1,
    ...analyticsMonthlyData.flatMap((item) => [
      item.income,
      item.expense,
    ])
  );

  // ==================================================
  // SETTINGS HELPERS
  // ==================================================

  const resetSettings = () => {
    setCurrency("INR");
    setTheme("light");
    setCompactMode(false);
    localStorage.removeItem("fintrack_currency");
    localStorage.removeItem("fintrack_theme");
    localStorage.removeItem("fintrack_compact");
  };

  const exportTransactions = () => {
    if (transactions.length === 0) {
      alert("There are no transactions to export.");
      return;
    }

    const headers = [
      "ID",
      "Title",
      "Amount",
      "Type",
      "Category",
      "Date",
    ];

    const rows = transactions.map((item) => [
      item.id,
      `"${String(item.title).replace(/"/g, '""')}"`,
      item.amount,
      item.type,
      item.category,
      item.date,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "fintrack-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const budgetData = budgets
    .map((budget) => {
      const spent = getCategorySpent(
        budget.category
      );

      const remaining =
        Number(budget.amount) - spent;

      const percentage =
        Number(budget.amount) > 0
          ? Math.round(
              (spent /
                Number(budget.amount)) *
                100
            )
          : 0;

      return {
        ...budget,
        spent,
        remaining,
        percentage,
        icon:
          categoryIcons[budget.category] ||
          "📦",
      };
    })
    .sort(
      (a, b) =>
        b.percentage - a.percentage
    );

  // ==================================================
  // ADD / UPDATE BUDGET
  // ==================================================

  const addBudget = async (e) => {
    e.preventDefault();

    if (
      !budgetForm.amount ||
      Number(budgetForm.amount) <= 0
    ) {
      alert(
        "Please enter a valid budget amount"
      );
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/budgets",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category:
              budgetForm.category,
            amount: Number(
              budgetForm.amount
            ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to save budget"
        );
      }

      const savedBudget =
        await response.json();

      setBudgets((prev) => {
        const exists = prev.some(
          (budget) =>
            budget.category ===
            savedBudget.category
        );

        if (exists) {
          return prev.map((budget) =>
            budget.category ===
            savedBudget.category
              ? savedBudget
              : budget
          );
        }

        return [...prev, savedBudget];
      });

      setBudgetForm({
        category: "Food",
        amount: "",
      });

      setShowBudgetForm(false);
    } catch (error) {
      console.error(
        "Error saving budget:",
        error
      );

      alert(
        "Could not save budget. Make sure the backend is running."
      );
    }
  };

  // ==================================================
  // DELETE BUDGET
  // ==================================================

  const deleteBudget = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/budgets/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete budget"
        );
      }

      setBudgets((prev) =>
        prev.filter(
          (budget) => budget.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Error deleting budget:",
        error
      );

      alert(
        "Could not delete budget."
      );
    }
  };

  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==================================================
  // FILTER TRANSACTIONS
  // ==================================================

  const filteredTransactions =
    transactions.filter(
      (transaction) => {
        const matchesSearch =
          transaction.title
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            );

        const matchesType =
          filterType === "all" ||
          transaction.type ===
            filterType;

        const matchesCategory =
          filterCategory === "all" ||
          transaction.category ===
            filterCategory;

        return (
          matchesSearch &&
          matchesType &&
          matchesCategory
        );
      }
    );

  // ==================================================
  // NAVIGATION
  // ==================================================

  const goToDashboard = () => {
    setActivePage("dashboard");
  };

  const goToTransactions = () => {
    setActivePage("transactions");
  };

  const goToBudgets = () => {
    setActivePage("budgets");
  };

  const goToAnalytics = () => {
    setActivePage("analytics");
  };

  const goToSettings = () => {
    setActivePage("settings");
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div
      className={`app ${compactMode ? "compact-mode" : ""}`}
      data-theme={theme}
    >

      {/* ================================================== */}
      {/* SIDEBAR */}
      {/* ================================================== */}

      <aside className="sidebar">

        <div className="logo">

          <div className="logo-icon">
            ₹
          </div>

          <div>
            <h2>FinTrack</h2>
            <span>
              Personal Finance
            </span>
          </div>

        </div>

        <nav>

          {/* DASHBOARD */}

          <div
            className={`nav-item ${
              activePage === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={goToDashboard}
            style={{
              cursor: "pointer",
            }}
          >
            <span>⌂</span>
            Dashboard
          </div>

          {/* TRANSACTIONS */}

          <div
            className={`nav-item ${
              activePage ===
              "transactions"
                ? "active"
                : ""
            }`}
            onClick={goToTransactions}
            style={{
              cursor: "pointer",
            }}
          >
            <span>↔</span>
            Transactions
          </div>

          {/* BUDGETS */}

          <div
            className={`nav-item ${
              activePage === "budgets"
                ? "active"
                : ""
            }`}
            onClick={goToBudgets}
            style={{
              cursor: "pointer",
            }}
          >
            <span>◈</span>
            Budgets
          </div>

          {/* ANALYTICS */}

          <div
            className={`nav-item ${
              activePage === "analytics" ? "active" : ""
            }`}
            onClick={goToAnalytics}
            style={{ cursor: "pointer" }}
          >
            <span>▣</span>
            Analytics
          </div>

          {/* SETTINGS */}

          <div
            className={`nav-item ${
              activePage === "settings" ? "active" : ""
            }`}
            onClick={goToSettings}
            style={{ cursor: "pointer" }}
          >
            <span>⚙</span>
            Settings
          </div>

        </nav>

        <div className="sidebar-bottom">

          <div className="profile">

            <div className="avatar">
              P
            </div>

            <div>
              <strong>
                My Account
              </strong>

              <small>
                Personal Finance
              </small>
            </div>

          </div>

        </div>

      </aside>

      {/* ================================================== */}
      {/* MAIN */}
      {/* ================================================== */}

      <main className="main">

        {/* ================================================== */}
        {/* DASHBOARD */}
        {/* ================================================== */}

        {activePage ===
          "dashboard" && (

          <>

            <header className="header">

              <div>

                <p className="welcome">
                  Good evening 👋
                </p>

                <h1>
                  Financial Dashboard
                </h1>

                <p className="subtitle">
                  Here's your financial overview
                  for August 2026.
                </p>

              </div>

              <button
                className="add-btn"
                onClick={() =>
                  setShowForm(true)
                }
              >
                + Add Transaction
              </button>

            </header>

            {/* SUMMARY */}

            <section className="summary-grid">

              {/* BALANCE */}

              <div className="summary-card balance-card">

                <div className="card-top">

                  <span>
                    Total Balance
                  </span>

                  <div className="card-icon">
                    ₹
                  </div>

                </div>

                <h2>
                  ₹
                  {balance.toLocaleString(
                    "en-IN"
                  )}
                </h2>

                <p
                  className={
                    balance >= 0
                      ? "positive"
                      : "negative"
                  }
                >
                  {balance >= 0
                    ? "↑"
                    : "↓"}{" "}
                  {Math.abs(
                    savingsRate
                  )}
                  %

                  <span>
                    savings rate
                  </span>

                </p>

              </div>

              {/* INCOME */}

              <div className="summary-card">

                <div className="card-top">

                  <span>
                    Total Income
                  </span>

                  <div className="card-icon income-icon">
                    ↗
                  </div>

                </div>

                <h2>
                  ₹
                  {income.toLocaleString(
                    "en-IN"
                  )}
                </h2>

                <p className="positive">
                  ↑
                  <span>
                    total income
                  </span>
                </p>

              </div>

              {/* EXPENSES */}

              <div className="summary-card">

                <div className="card-top">

                  <span>
                    Total Expenses
                  </span>

                  <div className="card-icon expense-icon">
                    ↘
                  </div>

                </div>

                <h2>
                  ₹
                  {expenses.toLocaleString(
                    "en-IN"
                  )}
                </h2>

                <p className="negative">
                  ↓
                  <span>
                    total spending
                  </span>
                </p>

              </div>

              {/* SAVINGS */}

              <div className="summary-card">

                <div className="card-top">

                  <span>
                    Savings Rate
                  </span>

                  <div className="card-icon saving-icon">
                    %
                  </div>

                </div>

                <h2>
                  {savingsRate}%
                </h2>

                <p className="positive">

                  {savingsRate >= 50
                    ? "Excellent"
                    : savingsRate > 0
                    ? "Good"
                    : "Needs improvement"}

                  <span>

                    {savingsRate >= 50
                      ? " keep it up!"
                      : " this month"}

                  </span>

                </p>

              </div>

            </section>

            {/* CONTENT */}

            <section className="content-grid">

              {/* RECENT TRANSACTIONS */}

              <div className="panel transactions-panel">

                <div className="panel-header">

                  <div>

                    <h2>
                      Recent Transactions
                    </h2>

                    <p>
                      Your latest financial activity
                    </p>

                  </div>

                  <button
                    className="view-btn"
                    onClick={
                      goToTransactions
                    }
                  >
                    View All →
                  </button>

                </div>

                <div className="transactions">

                  {loading ? (

                    <p className="loading">
                      Loading transactions...
                    </p>

                  ) : transactions.length ===
                    0 ? (

                    <p className="loading">
                      No transactions yet.
                      Add your first transaction!
                    </p>

                  ) : (

                    transactions.map(
                      (transaction) => (

                        <div
                          className="transaction"
                          key={
                            transaction.id
                          }
                        >

                          <div className="transaction-left">

                            <div
                              className={`transaction-icon ${
                                transaction.type ===
                                "income"
                                  ? "income-bg"
                                  : "expense-bg"
                              }`}
                            >
                              {transaction.type ===
                              "income"
                                ? "↗"
                                : "↘"}
                            </div>

                            <div>

                              <strong>
                                {
                                  transaction.title
                                }
                              </strong>

                              <span>
                                {
                                  transaction.category
                                }{" "}
                                •{" "}
                                {formatDate(
                                  transaction.date
                                )}
                              </span>

                            </div>

                          </div>

                          <strong
                            className={
                              transaction.type ===
                              "income"
                                ? "amount income"
                                : "amount expense"
                            }
                          >

                            {transaction.type ===
                            "income"
                              ? "+"
                              : "-"}

                            ₹
                            {Number(
                              transaction.amount
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </strong>

                        </div>

                      )
                    )

                  )}

                </div>

              </div>

              {/* SPENDING */}

              <div className="panel">

                <div className="panel-header">

                  <div>

                    <h2>
                      Spending Breakdown
                    </h2>

                    <p>
                      Your expenses by category
                    </p>

                  </div>

                </div>

                <div className="spending">

                  {spendingData.length ===
                  0 ? (

                    <p className="loading">
                      No expenses yet.
                    </p>

                  ) : (

                    spendingData.map(
                      (item) => (

                        <div
                          className="spending-item"
                          key={
                            item.category
                          }
                        >

                          <div className="spending-info">

                            <span>
                              {item.icon}{" "}
                              {
                                item.category
                              }
                            </span>

                            <strong>
                              ₹
                              {item.amount.toLocaleString(
                                "en-IN"
                              )}
                            </strong>

                          </div>

                          <div className="progress">

                            <div
                              style={{
                                width: `${item.percentage}%`,
                              }}
                            ></div>

                          </div>

                        </div>

                      )
                    )

                  )}

                </div>

              </div>

            </section>

            {/* INSIGHT */}

            <section className="insight">

              <div className="insight-icon">
                💡
              </div>

              <div>

                <h3>
                  Smart Financial Insight
                </h3>

                <p>

                  {balance >= 0 ? (

                    <>
                      You're currently saving{" "}

                      <strong>
                        ₹
                        {balance.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                      .

                      Keep your expenses below
                      your monthly income to
                      improve your savings rate.
                    </>

                  ) : (

                    <>
                      You're currently spending{" "}

                      <strong>
                        ₹
                        {Math.abs(
                          balance
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>{" "}

                      more than your recorded
                      income.

                      Try reducing your expenses
                      to improve your savings rate.
                    </>

                  )}

                </p>

              </div>

            </section>

          </>

        )}

        {/* ================================================== */}
        {/* TRANSACTIONS PAGE */}
        {/* ================================================== */}

        {activePage ===
          "transactions" && (

          <>

            <header className="header">

              <div>

                <p className="welcome">
                  Manage your money 💰
                </p>

                <h1>
                  Transactions
                </h1>

                <p className="subtitle">
                  View and manage all your income
                  and expenses.
                </p>

              </div>

              <button
                className="add-btn"
                onClick={() =>
                  setShowForm(true)
                }
              >
                + Add Transaction
              </button>

            </header>

            {/* TRANSACTION SUMMARY */}

            <section className="summary-grid">

              <div className="summary-card">

                <div className="card-top">

                  <span>
                    Total Transactions
                  </span>

                  <div className="card-icon">
                    #
                  </div>

                </div>

                <h2>
                  {transactions.length}
                </h2>

              </div>

              <div className="summary-card">

                <div className="card-top">

                  <span>
                    Total Income
                  </span>

                  <div className="card-icon income-icon">
                    ↗
                  </div>

                </div>

                <h2>
                  ₹
                  {income.toLocaleString(
                    "en-IN"
                  )}
                </h2>

              </div>

              <div className="summary-card">

                <div className="card-top">

                  <span>
                    Total Expenses
                  </span>

                  <div className="card-icon expense-icon">
                    ↘
                  </div>

                </div>

                <h2>
                  ₹
                  {expenses.toLocaleString(
                    "en-IN"
                  )}
                </h2>

              </div>

              <div className="summary-card">

                <div className="card-top">

                  <span>
                    Balance
                  </span>

                  <div className="card-icon saving-icon">
                    ₹
                  </div>

                </div>

                <h2>
                  ₹
                  {balance.toLocaleString(
                    "en-IN"
                  )}
                </h2>

              </div>

            </section>

            {/* FILTERS */}

            <div
              className="panel"
              style={{
                marginBottom: "24px",
              }}
            >

              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  alignItems:
                    "center",
                  flexWrap: "wrap",
                }}
              >

                <div
                  style={{
                    flex: "1",
                    minWidth: "250px",
                  }}
                >

                  <input
                    type="text"
                    placeholder="🔍 Search transactions..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      padding:
                        "13px 16px",
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "10px",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing:
                        "border-box",
                    }}
                  />

                </div>

                <select
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(
                      e.target.value
                    )
                  }
                  style={{
                    padding:
                      "13px 16px",
                    border:
                      "1px solid #ddd",
                    borderRadius:
                      "10px",
                    fontSize: "14px",
                    minWidth: "150px",
                    background:
                      "white",
                  }}
                >

                  <option value="all">
                    All Types
                  </option>

                  <option value="income">
                    Income
                  </option>

                  <option value="expense">
                    Expense
                  </option>

                </select>

                <select
                  value={filterCategory}
                  onChange={(e) =>
                    setFilterCategory(
                      e.target.value
                    )
                  }
                  style={{
                    padding:
                      "13px 16px",
                    border:
                      "1px solid #ddd",
                    borderRadius:
                      "10px",
                    fontSize: "14px",
                    minWidth: "170px",
                    background:
                      "white",
                  }}
                >

                  <option value="all">
                    All Categories
                  </option>

                  <option value="Food">
                    Food
                  </option>

                  <option value="Education">
                    Education
                  </option>

                  <option value="Shopping">
                    Shopping
                  </option>

                  <option value="Transport">
                    Transport
                  </option>

                  <option value="Entertainment">
                    Entertainment
                  </option>

                  <option value="Salary">
                    Salary
                  </option>

                  <option value="Freelance">
                    Freelance
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

            </div>

            {/* TABLE */}

            <div className="panel">

              <div className="panel-header">

                <div>

                  <h2>
                    All Transactions
                  </h2>

                  <p>
                    {
                      filteredTransactions.length
                    }{" "}
                    transaction
                    {filteredTransactions.length !==
                    1
                      ? "s"
                      : ""}{" "}
                    found
                  </p>

                </div>

              </div>

              {loading ? (

                <p className="loading">
                  Loading transactions...
                </p>

              ) : filteredTransactions.length ===
                0 ? (

                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "50px 20px",
                    color: "#777",
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        "45px",
                      marginBottom:
                        "10px",
                    }}
                  >
                    💸
                  </div>

                  <h3>
                    No transactions found
                  </h3>

                  <p>
                    Try changing your search
                    or filters.
                  </p>

                </div>

              ) : (

                <div
                  style={{
                    overflowX:
                      "auto",
                  }}
                >

                  <table
                    style={{
                      width: "100%",
                      borderCollapse:
                        "collapse",
                    }}
                  >

                    <thead>

                      <tr
                        style={{
                          borderBottom:
                            "1px solid #eee",
                          textAlign:
                            "left",
                        }}
                      >

                        <th style={tableHeaderStyle}>
                          Transaction
                        </th>

                        <th style={tableHeaderStyle}>
                          Category
                        </th>

                        <th style={tableHeaderStyle}>
                          Type
                        </th>

                        <th style={tableHeaderStyle}>
                          Date
                        </th>

                        <th style={tableHeaderStyle}>
                          Amount
                        </th>

                        <th style={tableHeaderStyle}>
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {filteredTransactions.map(
                        (transaction) => (

                          <tr
                            key={
                              transaction.id
                            }
                            style={{
                              borderBottom:
                                "1px solid #f0f0f0",
                            }}
                          >

                            <td style={tableCellStyle}>

                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  gap: "12px",
                                }}
                              >

                                <div
                                  className={`transaction-icon ${
                                    transaction.type ===
                                    "income"
                                      ? "income-bg"
                                      : "expense-bg"
                                  }`}
                                >
                                  {transaction.type ===
                                  "income"
                                    ? "↗"
                                    : "↘"}
                                </div>

                                <strong>
                                  {
                                    transaction.title
                                  }
                                </strong>

                              </div>

                            </td>

                            <td style={tableCellStyle}>
                              {categoryIcons[
                                transaction
                                  .category
                              ] || "📦"}{" "}
                              {
                                transaction.category
                              }
                            </td>

                            <td style={tableCellStyle}>

                              <span
                                style={{
                                  padding:
                                    "5px 10px",
                                  borderRadius:
                                    "20px",
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    "600",
                                  background:
                                    transaction.type ===
                                    "income"
                                      ? "#e8f8ef"
                                      : "#fff0f0",
                                  color:
                                    transaction.type ===
                                    "income"
                                      ? "#16a34a"
                                      : "#ef4444",
                                }}
                              >
                                {transaction.type ===
                                "income"
                                  ? "Income"
                                  : "Expense"}
                              </span>

                            </td>

                            <td
                              style={{
                                ...tableCellStyle,
                                color:
                                  "#666",
                              }}
                            >
                              {formatDate(
                                transaction.date
                              )}
                            </td>

                            <td
                              style={{
                                ...tableCellStyle,
                                fontWeight:
                                  "700",
                                color:
                                  transaction.type ===
                                  "income"
                                    ? "#16a34a"
                                    : "#ef4444",
                              }}
                            >

                              {transaction.type ===
                              "income"
                                ? "+"
                                : "-"}

                              ₹
                              {Number(
                                transaction.amount
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </td>

                            <td style={tableCellStyle}>

                              <button
                                onClick={() =>
                                  deleteTransaction(
                                    transaction.id
                                  )
                                }
                                style={{
                                  border:
                                    "none",
                                  background:
                                    "#fff0f0",
                                  color:
                                    "#ef4444",
                                  borderRadius:
                                    "8px",
                                  padding:
                                    "8px 12px",
                                  cursor:
                                    "pointer",
                                }}
                              >
                                🗑️
                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </>

        )}

        {/* ================================================== */}
        {/* BUDGETS PAGE */}
        {/* ================================================== */}

        {activePage ===
          "budgets" && (

          <>

            <header className="header">

              <div>

                <p className="welcome">
                  Plan your spending 🎯
                </p>

                <h1>
                  Budgets
                </h1>

                <p className="subtitle">
                  Set spending limits and stay
                  on track.
                </p>

              </div>

              <button
                className="add-btn"
                onClick={() =>
                  setShowBudgetForm(
                    true
                  )
                }
              >
                + Add Budget
              </button>

            </header>

            {/* BUDGET SUMMARY */}

            <section className="summary-grid">

              <div className="summary-card">

                <div className="card-top">

                  <span>
                    Total Budget
                  </span>

                  <div className="card-icon">
                    ₹
                  </div>

                </div>

                <h2>
                  ₹
                  {budgets
                    .reduce(
                      (sum, budget) =>
                        sum +
                        Number(
                          budget.amount
                        ),
                      0
                    )
                    .toLocaleString(
                      "en-IN"
                    )}
                </h2>

                <p className="positive">
                  Monthly limits
                </p>

              </div>

              <div className="summary-card">

                <div className="card-top">

                  <span>
                    Total Spent
                  </span>

                  <div className="card-icon expense-icon">
                    ↘
                  </div>

                </div>

                <h2>
                  ₹
                  {budgetData
                    .reduce(
                      (sum, budget) =>
                        sum +
                        budget.spent,
                      0
                    )
                    .toLocaleString(
                      "en-IN"
                    )}
                </h2>

                <p className="negative">
                  Current spending
                </p>

              </div>

              <div className="summary-card">

                <div className="card-top">

                  <span>
                    Remaining
                  </span>

                  <div className="card-icon saving-icon">
                    ₹
                  </div>

                </div>

                <h2>
                  ₹
                  {budgetData
                    .reduce(
                      (sum, budget) =>
                        sum +
                        budget.remaining,
                      0
                    )
                    .toLocaleString(
                      "en-IN"
                    )}
                </h2>

                <p className="positive">
                  Available budget
                </p>

              </div>

              <div className="summary-card">

                <div className="card-top">

                  <span>
                    Categories
                  </span>

                  <div className="card-icon">
                    #
                  </div>

                </div>

                <h2>
                  {budgets.length}
                </h2>

                <p className="positive">
                  Active budgets
                </p>

              </div>

            </section>

            {/* BUDGET LIST */}

            <div className="panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Category Budgets
                  </h2>

                  <p>
                    Track your spending limits
                  </p>

                </div>

              </div>

              {budgetLoading ? (

                <p className="loading">
                  Loading budgets...
                </p>

              ) : budgets.length ===
                0 ? (

                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "60px 20px",
                    color: "#777",
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        "50px",
                      marginBottom:
                        "10px",
                    }}
                  >
                    🎯
                  </div>

                  <h3>
                    No budgets yet
                  </h3>

                  <p>
                    Create your first budget
                    to start controlling
                    your spending.
                  </p>

                  <button
                    className="add-btn"
                    onClick={() =>
                      setShowBudgetForm(
                        true
                      )
                    }
                    style={{
                      marginTop:
                        "15px",
                    }}
                  >
                    + Create Budget
                  </button>

                </div>

              ) : (

                <div className="spending">

                  {budgetData.map(
                    (budget) => (

                      <div
                        className="spending-item"
                        key={
                          budget.id
                        }
                        style={{
                          padding:
                            "20px 0",
                        }}
                      >

                        <div className="spending-info">

                          <span>
                            {budget.icon}{" "}
                            {
                              budget.category
                            }
                          </span>

                          <strong>
                            ₹
                            {budget.spent.toLocaleString(
                              "en-IN"
                            )}
                            {" / "}
                            ₹
                            {Number(
                              budget.amount
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                        </div>

                        <div className="progress">

                          <div
                            style={{
                              width: `${budget.percentage}%`,
                              background:
                                budget.percentage >=
                                100
                                  ? "#ef4444"
                                  : budget.percentage >=
                                    80
                                  ? "#f59e0b"
                                  : undefined,
                            }}
                          ></div>

                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            marginTop:
                              "8px",
                            fontSize:
                              "13px",
                          }}
                        >

                          <span
                            style={{
                              color:
                                budget.remaining <
                                0
                                  ? "#ef4444"
                                  : "#777",
                            }}
                          >

                            {budget.remaining >=
                            0
                              ? `₹${budget.remaining.toLocaleString(
                                  "en-IN"
                                )} remaining`
                              : `₹${Math.abs(
                                  budget.remaining
                                ).toLocaleString(
                                  "en-IN"
                                )} over budget`}

                          </span>

                          <span
                            style={{
                              fontWeight:
                                "600",
                              color:
                                budget.percentage >=
                                100
                                  ? "#ef4444"
                                  : budget.percentage >=
                                    80
                                  ? "#f59e0b"
                                  : "#16a34a",
                            }}
                          >
                            {budget.percentage}%
                          </span>

                          <button
                            onClick={() =>
                              deleteBudget(
                                budget.id
                              )
                            }
                            style={{
                              border:
                                "none",
                              background:
                                "#fff0f0",
                              color:
                                "#ef4444",
                              borderRadius:
                                "8px",
                              padding:
                                "6px 10px",
                              cursor:
                                "pointer",
                            }}
                          >
                            🗑️
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </>

        )}

        {/* ================================================== */}
        {/* ANALYTICS PAGE */}
        {/* ================================================== */}

        {activePage === "analytics" && (
          <>
            <header className="header">
              <div>
                <p className="welcome">Understand your money 📊</p>
                <h1>Analytics</h1>
                <p className="subtitle">
                  Visualize income, expenses and spending patterns.
                </p>
              </div>

              <select
                value={analyticsPeriod}
                onChange={(e) => setAnalyticsPeriod(e.target.value)}
                style={{
                  padding: "12px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  background: "white",
                  fontSize: "14px",
                }}
              >
                <option value="all">All Time</option>
                <option value="30">Last 30 Days</option>
                <option value="7">Last 7 Days</option>
              </select>
            </header>

            <section className="summary-grid">
              <div className="summary-card">
                <div className="card-top">
                  <span>Income</span>
                  <div className="card-icon income-icon">↗</div>
                </div>
                <h2>{money(analyticsIncome)}</h2>
                <p className="positive">Total recorded income</p>
              </div>

              <div className="summary-card">
                <div className="card-top">
                  <span>Expenses</span>
                  <div className="card-icon expense-icon">↘</div>
                </div>
                <h2>{money(analyticsExpenses)}</h2>
                <p className="negative">Total recorded spending</p>
              </div>

              <div className="summary-card">
                <div className="card-top">
                  <span>Net Savings</span>
                  <div className="card-icon saving-icon">₹</div>
                </div>
                <h2>{money(analyticsBalance)}</h2>
                <p className={analyticsBalance >= 0 ? "positive" : "negative"}>
                  {analyticsBalance >= 0 ? "Positive cash flow" : "Spending exceeds income"}
                </p>
              </div>

              <div className="summary-card">
                <div className="card-top">
                  <span>Savings Rate</span>
                  <div className="card-icon">%</div>
                </div>
                <h2>{analyticsSavingsRate}%</h2>
                <p className={analyticsSavingsRate >= 0 ? "positive" : "negative"}>
                  Based on selected period
                </p>
              </div>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 1fr)",
                gap: "24px",
                marginTop: "24px",
              }}
            >
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Income vs Expenses</h2>
                    <p>Monthly financial performance</p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "18px",
                    height: "280px",
                    padding: "25px 10px 10px",
                    overflowX: "auto",
                  }}
                >
                  {analyticsMonthlyData.map((month) => (
                    <div
                      key={month.key}
                      style={{
                        minWidth: "70px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "5px",
                          height: "220px",
                        }}
                      >
                        <div
                          title={`${month.label} income: ${money(month.income)}`}
                          style={{
                            width: "20px",
                            height: `${Math.max(
                              4,
                              (month.income / maxMonthlyValue) * 210
                            )}px`,
                            borderRadius: "6px 6px 0 0",
                            background: "#22c55e",
                          }}
                        />

                        <div
                          title={`${month.label} expenses: ${money(month.expense)}`}
                          style={{
                            width: "20px",
                            height: `${Math.max(
                              4,
                              (month.expense / maxMonthlyValue) * 210
                            )}px`,
                            borderRadius: "6px 6px 0 0",
                            background: "#ef4444",
                          }}
                        />
                      </div>

                      <span
                        style={{
                          fontSize: "12px",
                          color: "#777",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {month.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    fontSize: "13px",
                    color: "#666",
                    marginTop: "8px",
                  }}
                >
                  <span>🟢 Income</span>
                  <span>🔴 Expenses</span>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Expense Distribution</h2>
                    <p>Where your money goes</p>
                  </div>
                </div>

                {analyticsCategoryData.length === 0 ? (
                  <p className="loading">No expense data available.</p>
                ) : (
                  <div className="spending">
                    {analyticsCategoryData.map((item) => (
                      <div className="spending-item" key={item.category}>
                        <div className="spending-info">
                          <span>
                            {item.icon} {item.category}
                          </span>
                          <strong>{money(item.amount)}</strong>
                        </div>

                        <div className="progress">
                          <div style={{ width: `${item.percentage}%` }} />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "6px",
                            fontSize: "12px",
                            color: "#777",
                          }}
                        >
                          <span>{item.percentage}% of expenses</span>
                          <span>{money(item.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section
              className="panel"
              style={{ marginTop: "24px" }}
            >
              <div className="panel-header">
                <div>
                  <h2>Financial Health</h2>
                  <p>Quick insights from your transaction history</p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#f7faf8",
                  }}
                >
                  <strong>💰 Cash Flow</strong>
                  <p style={{ margin: "8px 0 0", color: "#666" }}>
                    {analyticsBalance >= 0
                      ? "Your income is currently higher than your expenses."
                      : "Your expenses are currently higher than your income."}
                  </p>
                </div>

                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#f7faf8",
                  }}
                >
                  <strong>🎯 Budget Coverage</strong>
                  <p style={{ margin: "8px 0 0", color: "#666" }}>
                    {budgets.length > 0
                      ? `${budgets.length} category budget${
                          budgets.length === 1 ? "" : "s"
                        } are being tracked.`
                      : "Create category budgets to control spending."}
                  </p>
                </div>

                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#f7faf8",
                  }}
                >
                  <strong>📌 Top Category</strong>
                  <p style={{ margin: "8px 0 0", color: "#666" }}>
                    {analyticsCategoryData[0]
                      ? `${analyticsCategoryData[0].category} is your largest expense category.`
                      : "Add expenses to identify your top category."}
                  </p>
                </div>

                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#f7faf8",
                  }}
                >
                  <strong>📈 Savings</strong>
                  <p style={{ margin: "8px 0 0", color: "#666" }}>
                    {analyticsSavingsRate >= 30
                      ? "Great savings performance. Keep maintaining the habit!"
                      : analyticsSavingsRate >= 0
                      ? "There is room to improve your savings rate."
                      : "Review your expenses and set tighter budgets."}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ================================================== */}
        {/* SETTINGS PAGE */}
        {/* ================================================== */}

        {activePage === "settings" && (
          <>
            <header className="header">
              <div>
                <p className="welcome">Customize FinTrack ⚙️</p>
                <h1>Settings</h1>
                <p className="subtitle">
                  Manage your app preferences and data.
                </p>
              </div>
            </header>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Appearance</h2>
                  <p>Choose how FinTrack looks.</p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "16px",
                  maxWidth: "700px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    padding: "16px",
                    border: "1px solid #eee",
                    borderRadius: "12px",
                  }}
                >
                  <div>
                    <strong>Theme</strong>
                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#777",
                        fontSize: "13px",
                      }}
                    >
                      Select your preferred interface theme.
                    </p>
                  </div>

                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      border: "1px solid #ddd",
                      borderRadius: "9px",
                      background: "white",
                    }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    padding: "16px",
                    border: "1px solid #eee",
                    borderRadius: "12px",
                  }}
                >
                  <div>
                    <strong>Currency</strong>
                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#777",
                        fontSize: "13px",
                      }}
                    >
                      Choose the currency displayed in summaries and analytics.
                    </p>
                  </div>

                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      border: "1px solid #ddd",
                      borderRadius: "9px",
                      background: "white",
                    }}
                  >
                    <option value="INR">INR - ₹</option>
                    <option value="USD">USD - $</option>
                    <option value="EUR">EUR - €</option>
                    <option value="GBP">GBP - £</option>
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    padding: "16px",
                    border: "1px solid #eee",
                    borderRadius: "12px",
                  }}
                >
                  <div>
                    <strong>Compact Mode</strong>
                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#777",
                        fontSize: "13px",
                      }}
                    >
                      Reduce spacing in the interface.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCompactMode(!compactMode)}
                    style={{
                      border: "none",
                      borderRadius: "20px",
                      padding: "9px 16px",
                      cursor: "pointer",
                      background: compactMode ? "#111827" : "#e5e7eb",
                      color: compactMode ? "white" : "#333",
                    }}
                  >
                    {compactMode ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            </section>

            <section
              className="panel"
              style={{ marginTop: "24px" }}
            >
              <div className="panel-header">
                <div>
                  <h2>Data Management</h2>
                  <p>Export your financial records.</p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>Export Transactions</strong>
                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#777",
                      fontSize: "13px",
                    }}
                  >
                    Download all transactions as a CSV file.
                  </p>
                </div>

                <button
                  className="add-btn"
                  onClick={exportTransactions}
                >
                  ↓ Export CSV
                </button>
              </div>
            </section>

            <section
              className="panel"
              style={{ marginTop: "24px" }}
            >
              <div className="panel-header">
                <div>
                  <h2>Reset Preferences</h2>
                  <p>
                    Restore FinTrack's appearance and display settings.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetSettings}
                style={{
                  border: "1px solid #ef4444",
                  color: "#ef4444",
                  background: "#fff",
                  borderRadius: "10px",
                  padding: "11px 18px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Reset Settings
              </button>
            </section>
          </>
        )}

      </main>

      {/* ================================================== */}
      {/* ADD TRANSACTION MODAL */}
      {/* ================================================== */}

      {showForm && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>

                <h2>
                  Add Transaction
                </h2>

                <p>
                  Record your income or expense
                </p>

              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={addTransaction}
            >

              <label>
                Transaction Name
              </label>

              <input
                type="text"
                placeholder="e.g. Grocery Shopping"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title:
                      e.target.value,
                  })
                }
              />

              <label>
                Category
              </label>

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:
                      e.target.value,
                  })
                }
              >

                <option>Food</option>
                <option>
                  Education
                </option>
                <option>
                  Shopping
                </option>
                <option>
                  Transport
                </option>
                <option>
                  Entertainment
                </option>
                <option>
                  Salary
                </option>
                <option>
                  Freelance
                </option>
                <option>Other</option>

              </select>

              <label>
                Amount
              </label>

              <input
                type="number"
                min="1"
                placeholder="₹ Amount"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount:
                      e.target.value,
                  })
                }
              />

              <label>
                Transaction Type
              </label>

              <div className="type-buttons">

                <button
                  type="button"
                  className={
                    form.type ===
                    "expense"
                      ? "type-btn selected-expense"
                      : "type-btn"
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      type: "expense",
                    })
                  }
                >
                  Expense
                </button>

                <button
                  type="button"
                  className={
                    form.type ===
                    "income"
                      ? "type-btn selected-income"
                      : "type-btn"
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      type: "income",
                    })
                  }
                >
                  Income
                </button>

              </div>

              <button
                className="submit-btn"
                type="submit"
              >
                Add Transaction
              </button>

            </form>

          </div>

        </div>

      )}

      {/* ================================================== */}
      {/* ADD BUDGET MODAL */}
      {/* ================================================== */}

      {showBudgetForm && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>

                <h2>
                  Add Budget
                </h2>

                <p>
                  Set a spending limit for a
                  category
                </p>

              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setShowBudgetForm(
                    false
                  )
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={addBudget}>

              <label>
                Category
              </label>

              <select
                value={
                  budgetForm.category
                }
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    category:
                      e.target.value,
                  })
                }
              >

                <option>Food</option>
                <option>
                  Education
                </option>
                <option>
                  Shopping
                </option>
                <option>
                  Transport
                </option>
                <option>
                  Entertainment
                </option>
                <option>Other</option>

              </select>

              <label>
                Monthly Budget
              </label>

              <input
                type="number"
                min="1"
                placeholder="₹ Enter budget amount"
                value={
                  budgetForm.amount
                }
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    amount:
                      e.target.value,
                  })
                }
              />

              <button
                className="submit-btn"
                type="submit"
              >
                Save Budget
              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

// ==================================================
// TABLE STYLES
// ==================================================

const tableHeaderStyle = {
  padding: "15px 10px",
  color: "#777",
  fontSize: "13px",
};

const tableCellStyle = {
  padding: "17px 10px",
};

export default App;