import express from "express"
import sqlite3 from "sqlite3"
import path from "path"
import { open } from "sqlite"
import { fileURLToPath } from 'url';
import dotenv from "dotenv"



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: "backend/config/config.env" });

const app = express();

// Receive incoming object as JSON
app.use(express.json());

// Directory path to connect with DataBase
const dbPath = path.join(__dirname, "PersonalExpense.db");

// Connecting to the database
let database;
const intializeDb = async () => {
    try {
        database = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });

        //Create categories table
        await database.exec(`
            CREATE TABLE if not exists categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT CHECK(type IN ('income', 'expense')) NOT NULL
        );
    `);

        // Create transactions table
        await database.exec(`
            CREATE TABLE if not exists transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL
        );
    `);

        app.listen(process.env.PORT, () => {
            console.log(`Server running on Port ${process.env.PORT}`);
        });
    } catch (error) {
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
};

intializeDb();


// insert transaction into transactions table
app.post("/new", async (req, res) => {
    try {
        const { type, category, amount, date, description } = req.body;

        // Validate that required fields are not missing
        if (!type || !category || !amount || !date || !description) {
            return res
                .status(400)
                .send(
                    "All fields (type, category, amount, date, description) are required."
                );
        }
        // Insert address into the address table
        const addressDataQuery = `INSERT INTO transactions (type, category, amount, date, description) VALUES (?,?,?,?,?)`;
        
        await database.run(addressDataQuery, [
            type, category, amount, date, description
        ]);

        

        res.status(201).send("Added User Data Successfully");

    } catch (error) {
        res.status(500).send(`Error Due To ${error.message}`);
    }
});


// Get all Transactions
app.get("/getAll", async (req, res) => {
    try {
        
        // Get all Transactions
        const addressDataQuery = `select * from transactions`;
        
        const response= await database.all(addressDataQuery, []);

        res.status(201).send({response});

    } catch (error) {
        res.status(500).send(`Error Due To ${error.message}`);
    }
});


// Get Transaction by ID
app.get("/transactions/:id", async (req, res) => {
    try {
        
        const getTransactionByIdQuery = `select * from transactions where id=?`;
        
        const response= await database.all(getTransactionByIdQuery, [req.params.id]);

        res.status(201).send({response});

    } catch (error) {
        res.status(500).send(`Error Due To ${error.message}`);
    }
});


// Delete Transaction by ID
app.delete("/transactions/:id", async (req, res) => {

    try {
        const { type, category, amount, date, description } = req.body;
        const deleteTransactionByIdQuery = `DELETE FROM transactions WHERE id = ?`;
        
        await database.all(deleteTransactionByIdQuery, [req.params.id]);

        res.status(201).send("Transaction Deleted Successfully");

    } catch (error) {
        res.status(500).send(`Error Due To ${error.message}`);
    }
});

// Retrieve a summary of transactions
app.get("/summary", async (req, res) => {

    try {
        const sqlIncome = `SELECT SUM(amount) AS total_income FROM transactions WHERE type = 'income'`;
        const sqlExpense = `SELECT SUM(amount) AS total_expenses FROM transactions WHERE type = 'expense'`;

        
        const income=await database.get(sqlIncome, []);
        const expense=await database.get(sqlExpense, []);
        
        const totalIncome = income.total_income || 0;
        const totalExpenses = expense.total_expenses || 0;
        const balance = totalIncome - totalExpenses;

        res.status(201).send({
            total_income: totalIncome,
            total_expenses: totalExpenses,
            balance: balance
        });

    } catch (error) {
        res.status(500).send(`Error Due To ${error.message}`);
    }
});



