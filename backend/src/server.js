// const express = require("express"); old syntax

import express from 'express';
import dotenv from "dotenv";
import { initDB } from "./config/db.js";
import rateLimiter from './middleware/rateLimiter.js';

import transactionsRoute from "./routes/transactionsRoute.js";

dotenv.config();

const app = express();

// middleware is just a function that sits between the request and response of an application. It can access, modify, handle and pass along that request
app.use(rateLimiter);
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.get("/health", (req, res) => {
  res.send("its working");
});

app.use('/api/transactions', transactionsRoute);

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is up and running on PORT:", PORT);
  });
});