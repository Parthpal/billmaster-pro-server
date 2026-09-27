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
// File: Customer.js

// Auto-generate customer_id before saving safely
customerSchema.pre("save", async function () {
  if (!this.customer_id) {
    // 1. Find the single latest customer sorted by customer_id descending
    const lastCustomer = await this.constructor.findOne({}, { customer_id: 1 })
                                              .sort({ customer_id: -1 });

    let nextNumber = 1;

    if (lastCustomer && lastCustomer.customer_id) {
      // 2. Extract the number from the string (e.g., "CUST-0004" -> 4)
      const lastNumber = parseInt(lastCustomer.customer_id.replace("CUST-", ""), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // 3. Format with leading zeros
    this.customer_id = `CUST-${String(nextNumber).padStart(4, "0")}`;
  }
});

module.exports = mongoose.model("Customer", customerSchema);