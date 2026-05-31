// ═══════════════════════════════════════════════════════════════════
// BILLMASTER PRO — COMPLETE BACKEND (Node.js / Express / MongoDB)
// ═══════════════════════════════════════════════════════════════════
// File: server/index.js
// ─────────────────────────────────────────────────────────────────

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ──────────────────────────────────────────────────────────
app.use("/api/customers", require("./routes/customers"));
app.use("/api/products",  require("./routes/products"));
app.use("/api/invoices",  require("./routes/invoices"));
app.use("/api/settings",  require("./routes/settings"));
app.use("/api/reports",   require("./routes/reports"));
app.use("/api/email",     require("./routes/email"));

// ── 404 ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ── Error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || "Server error" });
});

// ── DB + Start ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => { console.error("❌ DB connection failed:", err); process.exit(1); });

module.exports = app;


// ═══════════════════════════════════════════════════════════════════
// MODELS
// ═══════════════════════════════════════════════════════════════════

// ── server/models/Customer.js ────────────────────────────────────────
/*
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  customer_id:    { type: String, unique: true },
  customer_name:  { type: String, required: true, trim: true },
  phone:          { type: String, required: true },
  email:          { type: String, required: true, lowercase: true, trim: true },
  address:        { type: String, default: "" },
  gst_number:     { type: String, default: "" },
}, { timestamps: true });

// Auto-generate customer_id before saving
customerSchema.pre("save", async function (next) {
  if (!this.customer_id) {
    const count = await this.constructor.countDocuments();
    this.customer_id = `CUST-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Customer", customerSchema);
*/


// ── server/models/Product.js ─────────────────────────────────────────
/*
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  product_id:    { type: String, unique: true },
  product_name:  { type: String, required: true, trim: true },
  product_image: { type: String, default: "" },
  category:      { type: String, required: true },
  price:         { type: Number, required: true, min: [0, "Price cannot be negative"] },
  gst:           { type: Number, default: 18, enum: [0, 5, 12, 18, 28] },
  stock:         { type: Number, default: 0, min: 0 },
  description:   { type: String, default: "" },
}, { timestamps: true });

// Unique price validation (soft — warn only)
productSchema.statics.findByPrice = function (price) {
  return this.findOne({ price });
};

productSchema.pre("save", async function (next) {
  if (!this.product_id) {
    const count = await this.constructor.countDocuments();
    this.product_id = `PROD-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
*/


// ── server/models/Invoice.js ─────────────────────────────────────────
/*
const mongoose = require("mongoose");

const invoiceProductSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },      // snapshot at time of invoice
  gst:      { type: Number, required: true },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoice_id:     { type: String, unique: true },
  invoice_number: { type: String, unique: true },
  customer:       { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  products:       [invoiceProductSchema],
  subtotal:       { type: Number, required: true },
  gst_total:      { type: Number, required: true },
  discount:       { type: Number, default: 0 },
  grand_total:    { type: Number, required: true },
  payment_method: { type: String, default: "Bank Transfer", enum: ["Bank Transfer","UPI","Cash","Cheque","Credit Card"] },
  invoice_date:   { type: Date, default: Date.now },
  status:         { type: String, default: "Pending", enum: ["Paid","Pending","Overdue","Draft"] },
  notes:          { type: String, default: "" },
  pdf_path:       { type: String, default: "" },
}, { timestamps: true });

invoiceSchema.pre("save", async function (next) {
  if (!this.invoice_id) {
    const Settings = require("./Settings");
    const settings = await Settings.findOne();
    const prefix = settings?.invoice_prefix || "INV";
    const year   = new Date().getFullYear();
    const count  = await this.constructor.countDocuments({ invoice_number: new RegExp(`^${prefix}-${year}`) });
    this.invoice_number = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;
    this.invoice_id     = this.invoice_number;
  }
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);
*/


// ── server/models/Settings.js ─────────────────────────────────────────
/*
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  company_name:    { type: String, default: "My Company" },
  gst_number:      { type: String, default: "" },
  email:           { type: String, default: "" },
  phone:           { type: String, default: "" },
  address:         { type: String, default: "" },
  logo:            { type: String, default: "" },
  invoice_prefix:  { type: String, default: "INV" },
  invoice_limit:   { type: Number, default: 0 },  // 0 = no limit
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
*/


// ═══════════════════════════════════════════════════════════════════
// ROUTES — Paste each block into its own file
// ═══════════════════════════════════════════════════════════════════

// ── server/routes/customers.js ───────────────────────────────────────
/*
const express  = require("express");
const router   = express.Router();
const ctrl     = require("../controllers/customerController");
const { auth } = require("../middleware/firebaseAuth");

router.get("/",    auth, ctrl.getAll);
router.post("/",   auth, ctrl.create);
router.put("/:id", auth, ctrl.update);
router.delete("/:id", auth, ctrl.remove);

module.exports = router;
*/

// ── server/routes/products.js ────────────────────────────────────────
/*
const express  = require("express");
const router   = express.Router();
const ctrl     = require("../controllers/productController");
const { auth } = require("../middleware/firebaseAuth");
const upload   = require("../middleware/upload");

router.get("/",       auth, ctrl.getAll);
router.post("/",      auth, upload.single("image"), ctrl.create);
router.put("/:id",    auth, upload.single("image"), ctrl.update);
router.delete("/:id", auth, ctrl.remove);

module.exports = router;
*/

// ── server/routes/invoices.js ────────────────────────────────────────
/*
const express  = require("express");
const router   = express.Router();
const ctrl     = require("../controllers/invoiceController");
const { auth } = require("../middleware/firebaseAuth");

router.get("/",           auth, ctrl.getAll);
router.get("/:id",        auth, ctrl.getOne);
router.post("/",          auth, ctrl.create);
router.put("/:id",        auth, ctrl.update);
router.delete("/:id",     auth, ctrl.remove);
router.get("/:id/pdf",    auth, ctrl.downloadPDF);

module.exports = router;
*/

// ── server/routes/email.js ──────────────────────────────────────────
/*
const express  = require("express");
const router   = express.Router();
const { auth } = require("../middleware/firebaseAuth");
const { sendInvoiceEmail } = require("../services/emailService");
const Invoice  = require("../models/Invoice");
const pdfSvc   = require("../services/pdfService");

router.post("/send/:invoiceId", auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
      .populate("customer").populate("products.product");
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const pdfBuffer = await pdfSvc.generatePDF(invoice);
    await sendInvoiceEmail(invoice, pdfBuffer);

    res.json({ success: true, message: "Invoice emailed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
*/

// ── server/routes/reports.js ─────────────────────────────────────────
/*
const express  = require("express");
const router   = express.Router();
const { auth } = require("../middleware/firebaseAuth");
const Invoice  = require("../models/Invoice");

router.get("/summary", auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from || to) {
      match.invoice_date = {};
      if (from) match.invoice_date.$gte = new Date(from);
      if (to)   match.invoice_date.$lte = new Date(to);
    }

    const [revenue, byMonth, byStatus] = await Promise.all([
      Invoice.aggregate([
        { $match: { ...match, status: "Paid" } },
        { $group: { _id: null, total: { $sum: "$grand_total" } } }
      ]),
      Invoice.aggregate([
        { $match: match },
        { $group: {
          _id: { year: { $year: "$invoice_date" }, month: { $month: "$invoice_date" } },
          revenue: { $sum: "$grand_total" }, count: { $sum: 1 }
        }},
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      Invoice.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$grand_total" } } }
      ])
    ]);

    res.json({ success: true, data: { revenue: revenue[0]?.total || 0, byMonth, byStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
*/


// ═══════════════════════════════════════════════════════════════════
// CONTROLLERS
// ═══════════════════════════════════════════════════════════════════

// ── server/controllers/customerController.js ─────────────────────────
/*
const Customer = require("../models/Customer");

exports.getAll = async (req, res) => {
  const { q } = req.query;
  const filter = q
    ? { $or: [
        { customer_name: { $regex: q, $options: "i" } },
        { email:         { $regex: q, $options: "i" } },
        { phone:         { $regex: q, $options: "i" } }
      ]}
    : {};
  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: customers });
};

exports.create = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "Customer already exists" });
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!customer) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data: customer });
};

exports.remove = async (req, res) => {
  await Customer.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Customer deleted" });
};
*/


// ── server/controllers/productController.js ──────────────────────────
/*
const Product = require("../models/Product");
const path    = require("path");
const fs      = require("fs");

exports.getAll = async (req, res) => {
  const { q, category } = req.query;
  const filter = {};
  if (q) filter.product_name = { $regex: q, $options: "i" };
  if (category) filter.category = category;
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: products });
};

exports.create = async (req, res) => {
  try {
    const { price } = req.body;
    const existing  = await Product.findByPrice(Number(price));
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Price ₹${price} already used by "${existing.product_name}"`
      });
    }
    const data = { ...req.body };
    if (req.file) data.product_image = `/uploads/${req.file.filename}`;
    const product = await Product.create(data);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.product_image = `/uploads/${req.file.filename}`;
  const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!product) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data: product });
};

exports.remove = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (product?.product_image) {
    const filePath = path.join(__dirname, "../uploads", path.basename(product.product_image));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  res.json({ success: true, message: "Product deleted" });
};
*/


// ── server/controllers/invoiceController.js ──────────────────────────
/*
const Invoice  = require("../models/Invoice");
const pdfSvc   = require("../services/pdfService");

exports.getAll = async (req, res) => {
  const { q, status, customer, from, to, sort } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (customer) filter.customer = customer;
  if (from || to) {
    filter.invoice_date = {};
    if (from) filter.invoice_date.$gte = new Date(from);
    if (to)   filter.invoice_date.$lte = new Date(to);
  }
  if (q) filter.invoice_number = { $regex: q, $options: "i" };

  const sortOpt = sort === "amount_asc"  ? { grand_total: 1 }
                : sort === "amount_desc" ? { grand_total: -1 }
                : { createdAt: -1 };

  const invoices = await Invoice.find(filter).populate("customer").populate("products.product").sort(sortOpt);
  res.json({ success: true, data: invoices });
};

exports.getOne = async (req, res) => {
  const inv = await Invoice.findById(req.params.id).populate("customer").populate("products.product");
  if (!inv) return res.status(404).json({ success: false, message: "Invoice not found" });
  res.json({ success: true, data: inv });
};

exports.create = async (req, res) => {
  try {
    const { customer, products, discount, payment_method, status } = req.body;
    const Product = require("../models/Product");

    let subtotal = 0, gst_total = 0;
    const lines = [];

    for (const line of products) {
      const p = await Product.findById(line.product);
      if (!p) return res.status(400).json({ success: false, message: `Product not found: ${line.product}` });
      const base = p.price * line.quantity;
      const gst  = base * (p.gst / 100);
      subtotal  += base;
      gst_total += gst;
      lines.push({ product: p._id, quantity: line.quantity, price: p.price, gst: p.gst });
    }

    const disc       = Number(discount) || 0;
    const grand_total = subtotal + gst_total - disc;

    const Settings = require("../models/Settings");
    const settings  = await Settings.findOne();
    if (settings?.invoice_limit && grand_total > settings.invoice_limit) {
      return res.status(400).json({ success: false, message: `Invoice exceeds configured limit of ₹${settings.invoice_limit}` });
    }

    const invoice = await Invoice.create({ customer, products: lines, subtotal, gst_total, discount: disc, grand_total, payment_method, status });
    const populated = await Invoice.findById(invoice._id).populate("customer").populate("products.product");
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  const inv = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate("customer").populate("products.product");
  if (!inv) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data: inv });
};

exports.remove = async (req, res) => {
  await Invoice.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Invoice deleted" });
};

exports.downloadPDF = async (req, res) => {
  const inv = await Invoice.findById(req.params.id).populate("customer").populate("products.product");
  if (!inv) return res.status(404).json({ success: false, message: "Not found" });
  const settings = await require("../models/Settings").findOne();
  const pdf = await pdfSvc.generatePDF(inv, settings);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${inv.invoice_number}.pdf"`);
  res.send(pdf);
};
*/


// ═══════════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════════

// ── server/services/pdfService.js ────────────────────────────────────
/*
const puppeteer = require("puppeteer");

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

const buildHTML = (invoice, settings = {}) => {
  const rows = invoice.products.map((item, i) => {
    const base = item.price * item.quantity;
    const gst  = base * (item.gst / 100);
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${item.product.product_name}</td>
        <td>${item.product.category}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td>${fmt(item.price)}</td>
        <td>${item.gst}% (${fmt(gst)})</td>
        <td style="text-align:right;font-weight:700">${fmt(base + gst)}</td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #4F46E5; }
  .logo { font-size: 28px; font-weight: 900; color: #4F46E5; }
  .inv-num { font-size: 22px; font-weight: 900; text-align: right; }
  .section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .box { background: #f8fafc; padding: 16px; border-radius: 10px; }
  .box-label { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 8px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #0f172a; color: white; }
  th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
  td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) { background: #fafbfc; }
  .totals { float: right; min-width: 260px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b; }
  .grand { font-size: 18px; font-weight: 800; color: #0f172a; padding: 12px 0 8px; border-top: 2px solid #0f172a; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
    background: ${invoice.status === "Paid" ? "#D1FAE5" : invoice.status === "Pending" ? "#FEF3C7" : "#FEE2E2"};
    color: ${invoice.status === "Paid" ? "#065F46" : invoice.status === "Pending" ? "#92400E" : "#991B1B"}; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">BillMaster Pro</div>
      <div style="margin-top:12px;line-height:1.8;color:#64748b">
        <strong style="color:#0f172a">${settings.company_name || ""}</strong><br/>
        ${settings.address || ""}<br/>
        GST: ${settings.gst_number || ""}<br/>
        ${settings.email || ""} | ${settings.phone || ""}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">INVOICE</div>
      <div class="inv-num">${invoice.invoice_number}</div>
      <div style="margin-top:8px;color:#64748b">Date: <strong>${new Date(invoice.invoice_date).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})}</strong></div>
      <div style="margin-top:10px"><span class="badge">${invoice.status}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="box">
      <div class="box-label">Bill To</div>
      <strong>${invoice.customer.customer_name}</strong><br/>
      ${invoice.customer.address || ""}<br/>
      ${invoice.customer.email} | ${invoice.customer.phone}<br/>
      ${invoice.customer.gst_number ? `GST: ${invoice.customer.gst_number}` : ""}
    </div>
    <div class="box">
      <div class="box-label">Payment Info</div>
      <strong>Method:</strong> ${invoice.payment_method}<br/>
      <strong>Status:</strong> <span class="badge">${invoice.status}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th><th>Product</th><th>Category</th>
        <th style="text-align:center">Qty</th>
        <th>Unit Price</th><th>GST</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
    <div class="total-row"><span>GST Total</span><span>${fmt(invoice.gst_total)}</span></div>
    ${invoice.discount > 0 ? `<div class="total-row" style="color:#10b981"><span>Discount</span><span>- ${fmt(invoice.discount)}</span></div>` : ""}
    <div class="total-row grand"><span>Grand Total</span><span style="color:#4F46E5">${fmt(invoice.grand_total)}</span></div>
  </div>
  <div style="clear:both"></div>

  <div class="footer">
    <p>Thank you for your business! Payment is due within 30 days.</p>
    <p>For queries: ${settings.email || ""} | ${settings.phone || ""}</p>
  </div>
</body>
</html>`;
};

exports.generatePDF = async (invoice, settings) => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox","--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(buildHTML(invoice, settings || {}), { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ format: "A4", margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }, printBackground: true });
  await browser.close();
  return pdf;
};
*/


// ── server/services/emailService.js ──────────────────────────────────
/*
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendInvoiceEmail = async (invoice, pdfBuffer) => {
  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

  await transporter.sendMail({
    from:    `"BillMaster Pro" <${process.env.SMTP_USER}>`,
    to:      invoice.customer.email,
    subject: `Invoice ${invoice.invoice_number} — ${fmt(invoice.grand_total)}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#4F46E5;margin:0 0 16px">Invoice ${invoice.invoice_number}</h2>
        <p>Dear <strong>${invoice.customer.customer_name}</strong>,</p>
        <p>Please find your invoice attached. Here's a summary:</p>
        <table width="100%" cellpadding="8" style="background:#fff;border-radius:8px;border-collapse:collapse;margin:20px 0">
          <tr><td><strong>Invoice #</strong></td><td>${invoice.invoice_number}</td></tr>
          <tr style="background:#f8fafc"><td><strong>Date</strong></td><td>${new Date(invoice.invoice_date).toLocaleDateString("en-IN")}</td></tr>
          <tr><td><strong>Amount</strong></td><td style="font-size:18px;font-weight:900;color:#4F46E5">${fmt(invoice.grand_total)}</td></tr>
          <tr style="background:#f8fafc"><td><strong>Status</strong></td><td>${invoice.status}</td></tr>
        </table>
        <p style="color:#64748b;font-size:13px">Thank you for your business!</p>
      </div>`,
    attachments: [
      {
        filename:    `${invoice.invoice_number}.pdf`,
        content:     pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};
*/


// ── server/middleware/firebaseAuth.js ─────────────────────────────────
/*
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

exports.auth = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};
*/


// ── server/middleware/upload.js ───────────────────────────────────────
/*
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const dir = path.join(__dirname, "../uploads");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, dir),
  filename:    (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const fileFilter = (_, file, cb) =>
  file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Only images allowed"), false);

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
*/


// ═══════════════════════════════════════════════════════════════════
// FRONTEND — CLIENT CONFIG FILES
// ═══════════════════════════════════════════════════════════════════

// ── client/src/firebase/config.js ────────────────────────────────────
/*
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app      = initializeApp(firebaseConfig);
export const auth            = getAuth(app);
export const googleProvider  = new GoogleAuthProvider();
export default app;
*/


// ── client/src/services/api.js ─────────────────────────────────────
/*
import axios from "axios";
import { auth } from "../firebase/config";

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api" });

// Attach Firebase token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data || err)
);

// ── Customers ────────────────────────────────────────────────────────
export const customerAPI = {
  getAll: (q) => api.get("/customers", { params: { q } }),
  create: (data) => api.post("/customers", data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// ── Products ─────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (q, category) => api.get("/products", { params: { q, category } }),
  create: (data) => { const fd = new FormData(); Object.entries(data).forEach(([k,v]) => fd.append(k, v)); return api.post("/products", fd); },
  update: (id, data) => { const fd = new FormData(); Object.entries(data).forEach(([k,v]) => fd.append(k, v)); return api.put(`/products/${id}`, fd); },
  delete: (id) => api.delete(`/products/${id}`),
};

// ── Invoices ─────────────────────────────────────────────────────────
export const invoiceAPI = {
  getAll:  (params) => api.get("/invoices", { params }),
  getOne:  (id) => api.get(`/invoices/${id}`),
  create:  (data) => api.post("/invoices", data),
  update:  (id, data) => api.put(`/invoices/${id}`, data),
  delete:  (id) => api.delete(`/invoices/${id}`),
  pdf:     (id) => api.get(`/invoices/${id}/pdf`, { responseType: "blob" }),
};

// ── Email ─────────────────────────────────────────────────────────────
export const emailAPI = {
  send: (id) => api.post(`/email/send/${id}`),
};

// ── Reports ───────────────────────────────────────────────────────────
export const reportAPI = {
  summary: (from, to) => api.get("/reports/summary", { params: { from, to } }),
};

export default api;
*/
