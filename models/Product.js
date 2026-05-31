const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  product_id:    { type: String, unique: true },
  product_name:  { type: String, required: true, trim: true },
  product_image: { type: String, default: "" },
  category:      { type: String, required: true },
  price:         { type: Number, required: true, min: [0, "Price cannot be negative"] },
  sale_price_locally: { type: Number, default: 0, min: 0 },
  price_on_product:   { type: Number, default: 0, min: 0 },
  brand_name:    { type: String, default: "", trim: true },
  shape:         { type: String, default: "" },
  units:         { type: String, default: "" },
  gst:           { type: Number, default: 0 }, // Default changed to 0% as requested
  stock:         { type: Number, default: 0, min: 0 },
  description:   { type: String, default: "" },
}, { timestamps: true });

// Unique price validation (soft — warn only)
productSchema.statics.findByPrice = function (price) {
  return this.findOne({ price });
};

// Change this section in models/Product.js

// FIXED: Removed 'next' parameter completely
productSchema.pre("save", async function () {
  if (!this.product_id) {
    const count = await this.constructor.countDocuments();
    this.product_id = `PROD-${String(count + 1).padStart(4, "0")}`;
  }
  // FIXED: Removed next();
});

module.exports = mongoose.model("Product", productSchema);