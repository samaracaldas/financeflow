import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import transactionRoutes from "./routes/transaction.routes";
import categoryRoutes from "./routes/category.routes";
import accountRoutes from "./routes/account.routes";


connectDB();

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/accounts', accountRoutes)

export default app;
