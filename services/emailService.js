const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendInvoiceEmail = async (invoice, pdfBuffer) => {
  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

  await transporter.sendMail({
    from:    `"BillMaster Pro" <${process.env.SMTP_USER}>`,
    to:      invoice.customer.email,
    subject: `Invoice ${invoice.invoice_number} — ${fmt(invoice.grand_total)}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#4F46E5;margin:0 0 16px">Invoice ${invoice.invoice_number}</h2>
        <p>Dear <strong>${invoice.customer.customer_name}</strong>,</p>
        <p>Please find your invoice attached. Here's a summary:</p>
        <table width="100%" cellpadding="8" style="background:#fff;border-radius:8px;border-collapse:collapse;margin:20px 0">
          <tr><td><strong>Invoice #</strong></td><td>${invoice.invoice_number}</td></tr>
          <tr style="background:#f8fafc"><td><strong>Date</strong></td><td>${new Date(invoice.invoice_date).toLocaleDateString("en-IN")}</td></tr>
          <tr><td><strong>Amount</strong></td><td style="font-size:18px;font-weight:900;color:#4F46E5">${fmt(invoice.grand_total)}</td></tr>
          <tr style="background:#f8fafc"><td><strong>Status</strong></td><td>${invoice.status}</td></tr>
        </table>
        <p style="color:#64748b;font-size:13px">Thank you for your business!</p>
      </div>`,
    attachments: [
      {
        filename:    `${invoice.invoice_number}.pdf`,
        content:     pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};