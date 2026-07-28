const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
});

const sendEmail = async (to, subject, html, attachments = []) => {
  const info = await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html,
    attachments,
  });
  return info;
};

const send2FACodeEmail = async (to, name, code) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f4f6f9;border-radius:12px">
      <div style="background:#7C3AED;padding:20px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0">LifeScore - Verificacion</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 12px 12px">
        <p style="font-size:16px;color:#333">Hola <strong>${name}</strong>,</p>
        <p style="font-size:16px;color:#333">Tu codigo de verificacion:</p>
        <div style="text-align:center;margin:30px 0">
          <span style="display:inline-block;font-size:36px;font-weight:bold;padding:12px 24px;background:#f0f0f0;border-radius:8px;letter-spacing:4px;color:#7C3AED">${code}</span>
        </div>
        <p style="font-size:14px;color:#666">Codigo valido por 5 minutos.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="font-size:12px;color:#999;text-align:center">&copy; ${new Date().getFullYear()} LifeScore</p>
      </div>
    </div>`;
  return sendEmail(to, 'LifeScore - Codigo de verificacion', html);
};

const sendWelcomeEmail = async (to, name) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f4f6f9;border-radius:12px">
      <div style="background:#7C3AED;padding:20px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0">Bienvenido a LifeScore</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 12px 12px">
        <p style="font-size:16px;color:#333">Hola <strong>${name}</strong>,</p>
        <p style="font-size:16px;color:#333">Gracias por unirte a LifeScore. Completa tus primeros habitos, gana puntos y sube de nivel.</p>
        <div style="text-align:center;margin:30px 0">
          <a href="http://localhost:5173/dashboard" style="display:inline-block;padding:12px 30px;background:#7C3AED;color:white;text-decoration:none;border-radius:8px;font-weight:bold">Comienza ahora</a>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="font-size:12px;color:#999;text-align:center">&copy; ${new Date().getFullYear()} LifeScore</p>
      </div>
    </div>`;
  return sendEmail(to, 'Bienvenido a LifeScore', html);
};

const sendPaymentConfirmationEmail = async (to, name, transactionId) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f4f6f9;border-radius:12px">
      <div style="background:#2ECC71;padding:20px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0">Pago confirmado</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 12px 12px">
        <p style="font-size:16px;color:#333">Hola <strong>${name}</strong>,</p>
        <p style="font-size:16px;color:#333">Tu pago ha sido procesado. Ahora eres <strong>miembro Premium</strong>.</p>
        <div style="background:#f0f7ff;padding:16px;border-radius:8px;margin:20px 0">
          <p style="font-size:14px;color:#333;margin:0"><strong>ID transaccion:</strong> ${transactionId}</p>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="font-size:12px;color:#999;text-align:center">&copy; ${new Date().getFullYear()} LifeScore</p>
      </div>
    </div>`;
  return sendEmail(to, 'LifeScore - Membresia Premium activada', html);
};

module.exports = { sendEmail, send2FACodeEmail, sendWelcomeEmail, sendPaymentConfirmationEmail };
