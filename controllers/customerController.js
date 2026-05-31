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

// CHANGE THIS:
exports.remove = async (req, res) => { // 👈 Changed 'delete' to 'remove'
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};