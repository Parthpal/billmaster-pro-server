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
//  NEW STABLE METHOD
customerSchema.pre("save", async function () {
  if (!this.customer_id) {
    const count = await this.constructor.countDocuments();
    this.customer_id = `CUST-${String(count + 1).padStart(4, "0")}`;
  }
  // No next() callback needed for async/await hooks!
});

module.exports = mongoose.model("Customer", customerSchema);