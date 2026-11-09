import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB, { dbState } from "./config/db";
import authRoutes from "./routes/auth.routes";
import transactionRoutes from "./routes/transaction.routes";
import categoryRoutes from "./routes/category.routes";
import accountRoutes from "./routes/account.routes";

const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"] as const;
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`[env] Variáveis ausentes: ${missingEnv.join(", ")}`);
}

connectDB();

const app = express();

// Render e Vercel ficam atrás de proxy
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "https://financesflow.vercel.app",
  ...(process.env.CLIENT_URL ?? "")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  const db = dbState();
  res.status(db === "connected" ? 200 : 503).json({
    status: db === "connected" ? "ok" : "degraded",
    db,
    missingEnv,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/accounts", accountRoutes);

export default app;
