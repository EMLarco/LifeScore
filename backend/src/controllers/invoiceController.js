const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { generateInvoicePDF, INVOICES_DIR } = require('../services/invoiceGenerator');
const { sendEmail } = require('../services/emailService');

const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `LS-${year}${month}-${random}`;
};

const generateInvoice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { paymentId, subscriptionId } = req.body;

    const user = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    let amount, description, currency;

    if (paymentId) {
      const payment = await pool.query('SELECT * FROM payments WHERE id = $1 AND user_id = $2', [paymentId, userId]);
      if (payment.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Pago no encontrado' });
      }
      amount = payment.rows[0].amount;
      currency = payment.rows[0].currency;
      description = payment.rows[0].description || 'Pago LifeScore';
    } else if (subscriptionId) {
      const sub = await pool.query('SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2', [subscriptionId, userId]);
      if (sub.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Suscripcion no encontrada' });
      }
      amount = sub.rows[0].amount;
      currency = sub.rows[0].currency;
      description = sub.rows[0].plan_name;
    } else {
      return res.status(400).json({ success: false, message: 'Proporciona paymentId o subscriptionId' });
    }

    const invoiceNumber = generateInvoiceNumber();

    const invoice = {
      invoice_number: invoiceNumber,
      customer_name: user.rows[0].name,
      customer_email: user.rows[0].email,
      amount,
      currency: currency || 'USD',
      description,
      created_at: new Date(),
    };

    const pdfPath = await generateInvoicePDF(invoice);

    await pool.query(
      `INSERT INTO invoices (user_id, subscription_id, payment_id, invoice_number, amount, currency, description, pdf_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, subscriptionId || null, paymentId || null, invoiceNumber, amount, currency || 'USD', description, pdfPath]
    );

    res.status(201).json({
      success: true,
      data: {
        invoiceNumber,
        downloadUrl: `/api/invoices/${invoiceNumber}/download`,
      },
    });
  } catch (error) {
    next(error);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const { invoiceNumber } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM invoices WHERE invoice_number = $1 AND user_id = $2',
      [invoiceNumber, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }

    const invoice = result.rows[0];

    if (!invoice.pdf_path || !fs.existsSync(invoice.pdf_path)) {
      const pdfPath = await generateInvoicePDF({
        invoice_number: invoice.invoice_number,
        customer_name: (await pool.query('SELECT name FROM users WHERE id = $1', [userId])).rows[0]?.name || 'Usuario',
        customer_email: (await pool.query('SELECT email FROM users WHERE id = $1', [userId])).rows[0]?.email || '',
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        created_at: invoice.created_at,
      });

      await pool.query('UPDATE invoices SET pdf_path = $1 WHERE id = $2', [pdfPath, invoice.id]);
      invoice.pdf_path = pdfPath;
    }

    res.download(invoice.pdf_path, `LifeScore_Invoice_${invoice.invoice_number}.pdf`);
  } catch (error) {
    next(error);
  }
};

const getUserInvoices = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, invoice_number, amount, currency, description, status, created_at FROM invoices WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const resendInvoice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { invoiceId } = req.params;

    const result = await pool.query(
      `SELECT i.*, u.name, u.email
       FROM invoices i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1 AND i.user_id = $2`,
      [invoiceId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }

    const invoice = result.rows[0];

    let pdfPath = invoice.pdf_path;
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      pdfPath = await generateInvoicePDF({
        invoice_number: invoice.invoice_number,
        customer_name: invoice.name,
        customer_email: invoice.email,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        created_at: invoice.created_at,
      });
      await pool.query('UPDATE invoices SET pdf_path = $1 WHERE id = $2', [pdfPath, invoice.id]);
    }

    const pdfBuffer = fs.readFileSync(pdfPath);

    await sendEmail(
      invoice.email,
      `Factura #${invoice.invoice_number} - LifeScore`,
      `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f4f6f9;border-radius:12px">
          <div style="background:#7C3AED;padding:20px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0">LifeScore - Factura</h1>
          </div>
          <div style="background:white;padding:30px;border-radius:0 0 12px 12px">
            <p style="font-size:16px;color:#333">Hola <strong>${invoice.name}</strong>,</p>
            <p style="font-size:16px;color:#333">Adjunto encontraras tu factura de suscripcion.</p>
            <div style="background:#f0f7ff;padding:16px;border-radius:8px;margin:20px 0">
              <p style="font-size:14px;color:#333;margin:0"><strong>Factura:</strong> ${invoice.invoice_number}</p>
              <p style="font-size:14px;color:#333;margin:4px 0 0"><strong>Total:</strong> $${Number(invoice.amount).toFixed(2)} ${invoice.currency}</p>
            </div>
            <p style="font-size:16px;color:#333">Gracias por confiar en LifeScore.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
            <p style="font-size:12px;color:#999;text-align:center">&copy; ${new Date().getFullYear()} LifeScore</p>
          </div>
        </div>
      `,
      [
        {
          filename: `LifeScore_Invoice_${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
        },
      ]
    );

    res.status(200).json({ success: true, message: 'Factura reenviada a tu correo' });
  } catch (error) {
    next(error);
  }
};

const downloadInvoiceById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { invoiceId } = req.params;

    const result = await pool.query(
      `SELECT i.*, u.name, u.email
       FROM invoices i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1 AND i.user_id = $2`,
      [invoiceId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }

    const invoice = result.rows[0];

    let pdfPath = invoice.pdf_path;
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      pdfPath = await generateInvoicePDF({
        invoice_number: invoice.invoice_number,
        customer_name: invoice.name,
        customer_email: invoice.email,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        created_at: invoice.created_at,
      });
      await pool.query('UPDATE invoices SET pdf_path = $1 WHERE id = $2', [pdfPath, invoice.id]);
    }

    res.download(pdfPath, `LifeScore_Invoice_${invoice.invoice_number}.pdf`);
  } catch (error) {
    next(error);
  }
};

module.exports = { generateInvoice, downloadInvoice, getUserInvoices, resendInvoice, downloadInvoiceById };
