const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// =========================================================
// 1. PRODUCTION CORS POLICY (IMPORTED FROM SERVER.JS)
// =========================================================
const allowedOrigins = [
  "http://localhost:3000",
  "https://billmasterpro-a4bf7.web.app",
  "https://billmasterpro-a4bf7.firebaseapp.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow internal server checks or tool requests with no origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || origin === process.env.CLIENT_URL) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "Accept",
      "X-Requested-With",
    ],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =========================================================
// 2. SERVERLESS MONGOOSE STABLE LOOP CONNECTION
// =========================================================
let cachedConnection = null;
const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState >= 1) {
    return cachedConnection;
  }
  
  try {
    cachedConnection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 
    });
    return cachedConnection;
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    throw err;
  }
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Database connection failed."
    });
  }
});

// =========================================================
// 3. BASE ROUTING 
// =========================================================
app.use("/api/customers", require(path.resolve(__dirname, "routes/customers")));
app.use("/api/products", require(path.resolve(__dirname, "routes/products")));
app.use("/api/invoices", require(path.resolve(__dirname, "routes/invoices")));

const loadOptionalRoute = (routePath, systemRoute) => {
  try {
    app.use(systemRoute, require(path.resolve(__dirname, routePath)));
  } catch (err) {
    console.log(`⚠ Optional route skipped: ${systemRoute}`);
  }
};

loadOptionalRoute("routes/settings", "/api/settings");
loadOptionalRoute("routes/reports", "/api/reports");
loadOptionalRoute("routes/email", "/api/email");

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BillMaster Pro Production API Running 🚀",
  });
});

// =========================================================
// 4. EXPLICIT FIXED 404 CLEAN INTERCEPTOR (USING ORIGINALURL)
// =========================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error safety layer
app.use((err, req, res, next) => {
  console.error("❌ Production Failure Context:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Execution Failure",
  });
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Local environment active on port ${PORT}`);
  });
}

module.exports = app;