const mongoose = require("mongoose");

const invoiceProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    gst: {
      type: Number,
      required: true,
      default: 0,
    },
    item_discount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoice_id: { type: String, unique: true },
    invoice_number: { type: String, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    products: [invoiceProductSchema],
    subtotal: { type: Number, required: true },
    gst_total: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },
    payment_method: { type: String, default: "Cash" },
    status: { type: String, default: "Paid" },
    dispatched_through: { type: String, default: "" },
    destination: { type: String, default: "" },
    terms_of_delivery: { type: String, default: "" },
    other_references: { type: String, default: "" },
    invoice_date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────────────────────────
// FIXED AUTO-GENERATION INVOICE NUMBER (Removed 'next' argument)
// ─────────────────────────────────────────────────────────────────
invoiceSchema.pre("save", async function () {
  try {
    if (!this.invoice_id) {
      let prefix = "INV";
      try {
        const Settings = require("./Settings");
        const settings = await Settings.findOne();
        if (settings?.invoice_prefix) {
          prefix = settings.invoice_prefix;
        }
      } catch (err) {
        console.log("Settings not found, using default prefix");
      }

      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments({
        invoice_number: new RegExp(`^${prefix}-${year}`),
      });

      const number = String(count + 1).padStart(3, "0");
      this.invoice_number = `${prefix}-${year}-${number}`;
      this.invoice_id = this.invoice_number;
    }
  } catch (err) {
    throw err; // Proper async promise handling rejection
  }
});

module.exports = mongoose.model("Invoice", invoiceSchema);