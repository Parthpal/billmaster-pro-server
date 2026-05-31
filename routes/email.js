const express  = require("express");
const router   = express.Router();
const { auth } = require("../middleware/firebaseAuth");
const { sendInvoiceEmail } = require("../services/emailService");
const Invoice  = require("../models/Invoice");
const pdfSvc   = require("../services/pdfService");

router.post("/send/:invoiceId", auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
      .populate("customer").populate("products.product");
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const pdfBuffer = await pdfSvc.generatePDF(invoice);
    await sendInvoiceEmail(invoice, pdfBuffer);

    res.json({ success: true, message: "Invoice emailed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;