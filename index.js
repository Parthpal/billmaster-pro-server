const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// 1. Strict Explicit CORS Policy
// const allowedOrigins = [
//   "https://billmasterpro-a4bf7.web.app",
//   "https://billmasterpro-a4bf7.firebaseapp.com",
//   "http://localhost:3000",
//   process.env.CLIENT_URL
// ].filter(Boolean);

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow internal/non-browser requests (like postman or health monitors)
//       if (!origin) return callback(null, true);
      
//       if (allowedOrigins.indexOf(origin) === -1) {
//         return callback(new Error("CORS policy violation: Origin not allowed."), false);
//       }
//       return callback(null, true);
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"]
//   })
// );

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 2. Serverless MongoDB Stable Connection Loop
let cachedConnection = null;
const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState >= 1) {
    return cachedConnection;
  }
  
  console.log("🔄 Initiating fresh MongoDB Atlas connection...");
  try {
    cachedConnection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // Give up quickly if credentials or whitelist is broken
    });
    console.log("✅ MongoDB connected securely");
    return cachedConnection;
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    throw err;
  }
};

// Route-independent DB assurance middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Database connection failed. Check serverless instance environments."
    });
  }
});

// 3. Absolute Base Routing (Using path.resolve prevents path drift in Vercel)
app.use("/api/customers", require(path.resolve(__dirname, "routes/customers")));
app.use("/api/products", require(path.resolve(__dirname, "routes/products")));
app.use("/api/invoices", require(path.resolve(__dirname, "routes/invoices")));

// Optional module handlers
const loadOptionalRoute = (routePath, systemRoute) => {
  try {
    app.use(systemRoute, require(path.resolve(__dirname, routePath)));
  } catch (err) {
    console.log(`⚠ Optional route module skipped: ${systemRoute}`);
  }
};

loadOptionalRoute("routes/settings", "/api/settings");
loadOptionalRoute("routes/reports", "/api/reports");
loadOptionalRoute("routes/email", "/api/email");

// 4. Production Root Verification
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BillMaster Pro Production API Running 🚀",
  });
});

// 5. Explicit 404 Catcher
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

// 6. Global Exception Safety Umbrella
app.use((err, req, res, next) => {
  console.error("❌ Production Server Crash Context:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Execution Failure",
  });
});

// Local debugging development bootup wrapper
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Local environment tracking active on port ${PORT}`);
  });
}

module.exports = app;