const puppeteer = require("puppeteer");

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

const buildHTML = (invoice, settings = {}) => {
  const rows = invoice.products.map((item, i) => {
    const base = item.price * item.quantity;
    const gst  = base * (item.gst / 100);
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${item.product.product_name}</td>
        <td>${item.product.category}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td>${fmt(item.price)}</td>
        <td>${item.gst}% (${fmt(gst)})</td>
        <td style="text-align:right;font-weight:700">${fmt(base + gst)}</td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #4F46E5; }
  .logo { font-size: 28px; font-weight: 900; color: #4F46E5; }
  .inv-num { font-size: 22px; font-weight: 900; text-align: right; }
  .section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .box { background: #f8fafc; padding: 16px; border-radius: 10px; }
  .box-label { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 8px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #0f172a; color: white; }
  th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
  td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) { background: #fafbfc; }
  .totals { float: right; min-width: 260px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b; }
  .grand { font-size: 18px; font-weight: 800; color: #0f172a; padding: 12px 0 8px; border-top: 2px solid #0f172a; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
    background: ${invoice.status === "Paid" ? "#D1FAE5" : invoice.status === "Pending" ? "#FEF3C7" : "#FEE2E2"};
    color: ${invoice.status === "Paid" ? "#065F46" : invoice.status === "Pending" ? "#92400E" : "#991B1B"}; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">BillMaster Pro</div>
      <div style="margin-top:12px;line-height:1.8;color:#64748b">
        <strong style="color:#0f172a">${settings.company_name || ""}</strong><br/>
        ${settings.address || ""}<br/>
        GST: ${settings.gst_number || ""}<br/>
        ${settings.email || ""} | ${settings.phone || ""}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">INVOICE</div>
      <div class="inv-num">${invoice.invoice_number}</div>
      <div style="margin-top:8px;color:#64748b">Date: <strong>${new Date(invoice.invoice_date).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})}</strong></div>
      <div style="margin-top:10px"><span class="badge">${invoice.status}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="box">
      <div class="box-label">Bill To</div>
      <strong>${invoice.customer.customer_name}</strong><br/>
      ${invoice.customer.address || ""}<br/>
      ${invoice.customer.email} | ${invoice.customer.phone}<br/>
      ${invoice.customer.gst_number ? `GST: ${invoice.customer.gst_number}` : ""}
    </div>
    <div class="box">
      <div class="box-label">Payment Info</div>
      <strong>Method:</strong> ${invoice.payment_method}<br/>
      <strong>Status:</strong> <span class="badge">${invoice.status}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th><th>Product</th><th>Category</th>
        <th style="text-align:center">Qty</th>
        <th>Unit Price</th><th>GST</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
    <div class="total-row"><span>GST Total</span><span>${fmt(invoice.gst_total)}</span></div>
    ${invoice.discount > 0 ? `<div class="total-row" style="color:#10b981"><span>Discount</span><span>- ${fmt(invoice.discount)}</span></div>` : ""}
    <div class="total-row grand"><span>Grand Total</span><span style="color:#4F46E5">${fmt(invoice.grand_total)}</span></div>
  </div>
  <div style="clear:both"></div>

  <div class="footer">
    <p>Thank you for your business! Payment is due within 30 days.</p>
    <p>For queries: ${settings.email || ""} | ${settings.phone || ""}</p>
  </div>
</body>
</html>`;
};

exports.generatePDF = async (invoice, settings) => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox","--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(buildHTML(invoice, settings || {}), { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ format: "A4", margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }, printBackground: true });
  await browser.close();
  return pdf;
};