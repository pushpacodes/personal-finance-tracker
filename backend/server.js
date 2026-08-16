const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// DATABASE
// ==========================================

const db = new sqlite3.Database("./finance.db", (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to SQLite database");
    }
});

// ==========================================
// TRANSACTIONS TABLE
// ==========================================

db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL
    )
`);

// ==========================================
// BUDGETS TABLE
// ==========================================

db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL UNIQUE,
        amount REAL NOT NULL
    )
`);

// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "Personal Finance Tracker API is running!"
    });
});

// ==========================================
// TRANSACTION APIs
// ==========================================

// Get all transactions
app.get("/api/transactions", (req, res) => {
    db.all(
        "SELECT * FROM transactions ORDER BY date DESC, id DESC",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// Add transaction
app.post("/api/transactions", (req, res) => {

    const {
        title,
        amount,
        type,
        category,
        date
    } = req.body;

    if (
        !title ||
        !amount ||
        !type ||
        !category ||
        !date
    ) {
        return res.status(400).json({
            error: "All fields are required"
        });
    }

    const sql = `
        INSERT INTO transactions
        (title, amount, type, category, date)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            title,
            Number(amount),
            type,
            category,
            date
        ],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                id: this.lastID,
                title,
                amount: Number(amount),
                type,
                category,
                date
            });

        }
    );
});

// Delete transaction
app.delete("/api/transactions/:id", (req, res) => {

    const { id } = req.params;

    db.run(
        "DELETE FROM transactions WHERE id = ?",
        [id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: "Transaction deleted successfully"
            });

        }
    );
});

// ==========================================
// BUDGET APIs
// ==========================================

// Get all budgets
app.get("/api/budgets", (req, res) => {

    db.all(
        "SELECT * FROM budgets ORDER BY category ASC",
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// Add or update budget
app.post("/api/budgets", (req, res) => {

    const {
        category,
        amount
    } = req.body;

    if (
        !category ||
        !amount ||
        Number(amount) <= 0
    ) {
        return res.status(400).json({
            error: "Valid category and amount are required"
        });
    }

    const sql = `
        INSERT INTO budgets
        (category, amount)
        VALUES (?, ?)
        ON CONFLICT(category)
        DO UPDATE SET amount = excluded.amount
    `;

    db.run(
        sql,
        [
            category,
            Number(amount)
        ],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            db.get(
                "SELECT * FROM budgets WHERE category = ?",
                [category],
                (getErr, row) => {

                    if (getErr) {
                        return res.status(500).json({
                            error: getErr.message
                        });
                    }

                    res.status(201).json(row);
                }
            );

        }
    );
});

// Delete budget
app.delete("/api/budgets/:id", (req, res) => {

    const { id } = req.params;

    db.run(
        "DELETE FROM budgets WHERE id = ?",
        [id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: "Budget deleted successfully"
            });
        }
    );
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});