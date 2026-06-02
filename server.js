const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// =======================
// CORS CONFIGURATION
// =======================
const allowedOrigins = [
  "http://localhost:3000",
  "https://billmasterpro-a4bf7.web.app",
  "https://billmasterpro-a4bf7.firebaseapp.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin (Postman, mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
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

// =======================
// MIDDLEWARE
// =======================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =======================
// API ROUTES
// =======================
app.use("/api/customers", require("./routes/customers"));
app.use("/api/products", require("./routes/products"));
app.use("/api/invoices", require("./routes/invoices"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/email", require("./routes/email"));

// =======================
// HEALTH CHECK
// =======================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BillMaster Pro API Running",
  });
});

// =======================
// 404 HANDLER
// =======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =======================
// ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

// =======================
// DATABASE CONNECTION
// =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server Running On Port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err);
    process.exit(1);
  });

module.exports = app;