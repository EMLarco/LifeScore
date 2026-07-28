const pool = require('../config/database');
const fs = require('fs');
const { generateInvoicePDF } = require('../services/invoiceGenerator');
const { sendEmail } = require('../services/emailService');

const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `LS-${year}${month}-${random}`;
};

const createTransaction = async (userId, orderId, type, plan, amount, metadata = {}) => {
  const result = await pool.query(
    `INSERT INTO transactions (user_id, paypal_order_id, type, plan, amount, status, metadata, completed_at)
     VALUES ($1, $2, $3, $4, $5, 'completed', $6, NOW())
     RETURNING *`,
    [userId, orderId, type, plan, amount, JSON.stringify(metadata)]
  );
  return result.rows[0];
};

const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getTransactionById = async (userId, transactionId) => {
  const result = await pool.query(
    `SELECT t.*, u.name, u.email, u.username
     FROM transactions t
     JOIN users u ON t.user_id = u.id
     WHERE t.id = $1 AND t.user_id = $2`,
    [transactionId, userId]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
};

const TYPE_LABELS = {
  subscription: 'Suscripcion',
  points: 'Compra de puntos',
  skin: 'Skin premium',
};

const sendInvoice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { transactionId } = req.params;

    const data = await getTransactionById(userId, parseInt(transactionId));
    if (!data) {
      return res.status(404).json({ success: false, message: 'Transaccion no encontrada' });
    }

    const invoiceNumber = generateInvoiceNumber();

    const pdfPath = await generateInvoicePDF({
      invoice_number: invoiceNumber,
      customer_name: data.name,
      customer_email: data.email,
      amount: data.amount,
      currency: data.currency || 'USD',
      description: TYPE_LABELS[data.type] || data.type,
      plan: data.plan,
      transaction_type: data.type,
      metadata: data.metadata,
      created_at: data.completed_at || data.created_at,
    });

    const pdfBuffer = fs.readFileSync(pdfPath);

    const pointsLine = data.metadata?.points
      ? `<p style="font-size:14px;color:#333;margin:4px 0"><strong>Puntos obtenidos:</strong> ${data.metadata.points}</p>`
      : '';

    await sendEmail(
      data.email,
      `Factura #${invoiceNumber} - LifeScore`,
      `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f4f6f9;border-radius:12px">
          <div style="background:#7C3AED;padding:20px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0">LifeScore - Factura</h1>
          </div>
          <div style="background:white;padding:30px;border-radius:0 0 12px 12px">
            <p style="font-size:16px;color:#333">Hola <strong>${data.name}</strong>,</p>
            <p style="font-size:16px;color:#333">Adjunto encontraras tu factura.</p>
            <div style="background:#f0f7ff;padding:16px;border-radius:8px;margin:20px 0">
              <p style="font-size:14px;color:#333;margin:0"><strong>Factura:</strong> ${invoiceNumber}</p>
              <p style="font-size:14px;color:#333;margin:4px 0"><strong>Tipo:</strong> ${TYPE_LABELS[data.type] || data.type}</p>
              <p style="font-size:14px;color:#333;margin:4px 0"><strong>Total:</strong> $${Number(data.amount).toFixed(2)} ${data.currency}</p>
              ${pointsLine}
            </div>
            <p style="font-size:16px;color:#333">Gracias por tu compra.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
            <p style="font-size:12px;color:#999;text-align:center">&copy; ${new Date().getFullYear()} LifeScore</p>
          </div>
        </div>
      `,
      [
        {
          filename: `LifeScore_Invoice_${invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ]
    );

    res.status(200).json({ success: true, message: 'Factura enviada al correo' });
  } catch (error) {
    next(error);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { transactionId } = req.params;

    const data = await getTransactionById(userId, parseInt(transactionId));
    if (!data) {
      return res.status(404).json({ success: false, message: 'Transaccion no encontrada' });
    }

    const invoiceNumber = generateInvoiceNumber();

    const pdfPath = await generateInvoicePDF({
      invoice_number: invoiceNumber,
      customer_name: data.name,
      customer_email: data.email,
      amount: data.amount,
      currency: data.currency || 'USD',
      description: TYPE_LABELS[data.type] || data.type,
      plan: data.plan,
      transaction_type: data.type,
      metadata: data.metadata,
      created_at: data.completed_at || data.created_at,
    });

    res.download(pdfPath, `LifeScore_Invoice_${invoiceNumber}.pdf`);
  } catch (error) {
    next(error);
  }
};

module.exports = { createTransaction, getTransactions, sendInvoice, downloadInvoice };
