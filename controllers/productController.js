const Product = require("../models/Product");
const path    = require("path");
const fs      = require("fs");

// NEW: Fetch a single product by ID
exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = {};
    if (q) filter.product_name = { $regex: q, $options: "i" };
    if (category) filter.category = category;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// exports.create = async (req, res) => {
//   try {
//     const { price } = req.body;
//     const existing  = await Product.findByPrice(Number(price));
//     if (existing) {
//       return res.status(400).json({
//         success: false,
//         message: `Price ₹${price} already used by "${existing.product_name}"`
//       });
//     }
//     const data = { ...req.body };
//     if (req.file) data.product_image = `/uploads/${req.file.filename}`;
//     const product = await Product.create(data);
//     res.status(201).json({ success: true, data: product });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      data.product_image = `/uploads/${req.file.filename}`;
    }

    const product = await Product.create(data);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.product_image = `/uploads/${req.file.filename}`;
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Not found" });
    
    if (product?.product_image) {
      const filePath = path.join(__dirname, "../uploads", path.basename(product.product_image));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};