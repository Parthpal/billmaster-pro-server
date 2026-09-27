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
      cgst_rate,
      sgst_rate,
      igst_rate
    } = req.body;

    let subtotal = 0;
    const lines = [];

    for (const line of products) {
      let price = Number(line.price) || 0;
      let productId = null;
      let productName = line.product_name || "Custom Item";

      // If it's a DB product, fetch its real data; skip if manual item
      if (line.product) {
        const p = await Product.findById(line.product);
        if (p) {
          productId = p._id;
          productName = p.product_name;
          if (line.price === undefined || line.price === "") {
            price = Number(p.price || p["Sale Price (Est.) Barabazar"]) || 0;
          }
        }
      }

      const qty = Number(line.quantity) || 1;
const lineDiscPercent = Number(line.item_discount) || 0;
const grossLineAmount = price * qty;
const discountAmount = grossLineAmount * (lineDiscPercent / 100);
const netLineAmount = grossLineAmount - discountAmount;
      subtotal += netLineAmount;

      lines.push({
        product: productId,
        product_name: productId ? undefined : productName,
        quantity: qty,
        price: price,
        gst: 0,
        item_discount: lineDisc,
      });
    }

    // Dynamic tax calculation from custom edited input box entries
    const cRate = cgst_rate !== undefined ? Number(cgst_rate) : 2.5;
    const sRate = sgst_rate !== undefined ? Number(sgst_rate) : 2.5;
    const iRate = igst_rate !== undefined ? Number(igst_rate) : 0;

    const cgst_total = subtotal * (cRate / 100);
    const sgst_total = subtotal * (sRate / 100);
    const igst_total = subtotal * (iRate / 100);
    const combinedGst = cgst_total + sgst_total + igst_total;
    const totalBeforeRoundOff = subtotal + combinedGst;
    const grand_total = Math.round(totalBeforeRoundOff);

    const invoice = await Invoice.create({
      customer,
      products: lines,
      subtotal: subtotal,
      gst_total: combinedGst,
      cgst_rate: cRate,
      sgst_rate: sRate,
      igst_rate: iRate,
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
    const { products, cgst_rate, sgst_rate, igst_rate } = req.body;
    
    // Recalculate totals on server side for safety during standard updates
    if (products) {
      let subtotal = 0;
      const lines = [];

      for (const line of products) {
        let price = Number(line.price) || 0;
        let productId = null;
        let productName = line.product_name || "Custom Item";

        if (line.product) {
          const p = await Product.findById(line.product);
          if (p) {
            productId = p._id;
            productName = p.product_name;
            if (line.price === undefined || line.price === "") {
              price = Number(p.price || p["Sale Price (Est.) Barabazar"]) || 0;
            }
          }
        }

        const qty = Number(line.quantity) || 1;
const lineDiscPercent = Number(line.item_discount) || 0;
const grossLineAmount = price * qty;
const discountAmount = grossLineAmount * (lineDiscPercent / 100);
const netLineAmount = grossLineAmount - discountAmount;

subtotal += netLineAmount;

        lines.push({
          product: productId,
          product_name: productId ? undefined : productName,
          quantity: qty,
          price: price,
          gst: 0,
         item_discount: lineDiscPercent,
        });
      }

      const cRate = cgst_rate !== undefined ? Number(cgst_rate) : 2.5;
      const sRate = sgst_rate !== undefined ? Number(sgst_rate) : 2.5;
      const iRate = igst_rate !== undefined ? Number(igst_rate) : 0;

      const cgst_total = subtotal * (cRate / 100);
      const sgst_total = subtotal * (sRate / 100);
      const igst_total = subtotal * (iRate / 100);
      const combinedGst = cgst_total + sgst_total + igst_total;
      
      req.body.products = lines;
      req.body.subtotal = subtotal;
      req.body.gst_total = combinedGst;
      req.body.grand_total = subtotal + combinedGst;
    }

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