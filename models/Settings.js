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