// const express = require("express"); old syntax

import express from 'express';
import dotenv from "dotenv";
import { sql } from "./config/db.js";

dotenv.config();

const app = express();

// middleware is just a function that sits between the request and response of an application. It can access, modify, handle and pass along that request
app.use(express.json());

const PORT = process.env.PORT || 5001;

async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id serial PRIMARY KEY,
        user_id varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category varchar(255) NOT NULL,
        created_at date NOT NULL DEFAULT CURRENT_DATE)
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializaing DB", error);
    process.exit(1); // status code 1 means failure, 0 success
  }
}

app.get("/api/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await sql`
      SELECT
        *
      FROM
        transactions
      WHERE
        user_id = ${userId}
      ORDER BY
        created_at DESC
    `;
    res.status(200).json(transactions);
  } catch (error) {
    console.log("Error getting the transactions", error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const { title, amount, category, user_id } = req.body;

    if (!title || !user_id || !category || amount === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const transaction = await sql`
      INSERT INTO transactions (user_id, title, amount, category)
        VALUES (${user_id}, ${title}, ${amount}, ${category})
      RETURNING
        *
    `;

    console.log(transaction);
    res.status(201).json(transaction[0]);

  } catch (error) {
    console.log("Error creating the transaction", error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const result = await sql`
      DELETE FROM transactions
      WHERE id = ${id}
      RETURNING
        *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction is not found in the database" });
    }

    res.status(200).json({ message: "Transactions deleted successfully" });

  } catch (error) {
    console.log("Error deleting the transaction", error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
});

app.get("/api/transactions/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const balanceResult = await sql`
      SELECT
        COALESCE(SUM(amount), 0) AS balance
      FROM
        transactions
      WHERE
        user_id = ${userId}
    `;

    const incomeResult = await sql`
      SELECT
        COALESCE(SUM(amount), 0) AS income
      FROM
        transactions
      WHERE
        user_id = ${userId}
        AND amount > 0
    `;

    const expensesResult = await sql`
      SELECT
        COALESCE(SUM(amount), 0) AS expenses
      FROM
        transactions
      WHERE
        user_id = ${userId}
        AND amount < 0
    `;

    res.status(200).json({
      balance: balanceResult[0].balance,
      income: incomeResult[0].income,
      expense: expensesResult[0].expenses
    });
  } catch (error) {
    console.log("Error getting the transaction summary", error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
});
initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is up and running on PORT:", PORT);
  });
});