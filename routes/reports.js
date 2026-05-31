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