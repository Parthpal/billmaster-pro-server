const Invoice = require("../models/Invoice");
const Product = require("../models/Product");

exports.getAll = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate("customer").populate("products.product").sort({ createdAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id).populate("customer").populate("products.product");
    if (!inv) return res.status(404).json({ success: false, message: "Invoice not found" });
    res.json({ success: true, data: inv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      customer,
      products,
      payment_method,
      status,
      dispatched_through,
      destination,
      terms_of_delivery,
      other_references,
    } = req.body;

    let subtotal = 0; // Serves as the global Taxable Value
    const lines = [];

    for (const line of products) {
      const p = await Product.findById(line.product);
      if (!p) return res.status(400).json({ success: false, message: "Product record not found" });

      const qty = Number(line.quantity) || 1;
      const price = line.price !== undefined ? Number(line.price) : (Number(p.price || p["Sale Price (Est.) Barabazar"]) || 0);
      const lineDisc = Number(line.item_discount) || 0;

      const netLineAmount = (price * qty) - lineDisc;
      subtotal += netLineAmount;

      lines.push({
        product: p._id,
        quantity: qty,
        price: price,
        gst: 0, // Cleared individual line item taxation flag
        item_discount: lineDisc,
      });
    }

    // Apply global overall CGST + SGST calculations matching image_5b089c.png
    const cgst_total = subtotal * 0.025;
    const sgst_total = subtotal * 0.025;
    const combinedGst = cgst_total + sgst_total;
    const grand_total = subtotal + combinedGst;

    const invoice = await Invoice.create({
      customer,
      products: lines,
      subtotal: subtotal, // Taxable base value
      gst_total: combinedGst, // Combined total tax value
      discount: 0,
      grand_total: grand_total,
      payment_method,
      status,
      dispatched_through,
      destination,
      terms_of_delivery,
      other_references,
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const inv = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: inv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Invoice removed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};