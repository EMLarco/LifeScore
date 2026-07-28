const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
const path = require('path');
const fs = require('fs');

pdfMake.addVirtualFileSystem(pdfFonts);
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};

const INVOICES_DIR = path.join(__dirname, '..', '..', 'uploads', 'invoices');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const generateInvoicePDF = async (invoice) => {
  ensureDir(INVOICES_DIR);

  const TYPE_LABELS = {
    subscription: 'Suscripcion',
    points: 'Compra de puntos',
    skin: 'Skin premium',
  };

  const typeLabel = TYPE_LABELS[invoice.transaction_type] || invoice.description || 'Transaccion';

  const detailsColumn = [
    { text: `Tipo: ${typeLabel}\n`, fontSize: 10, color: '#333' },
  ];
  if (invoice.plan) {
    detailsColumn.push({ text: `Plan: ${invoice.plan}\n`, fontSize: 10, color: '#333' });
  }
  if (invoice.metadata?.points) {
    detailsColumn.push({ text: `Puntos: ${invoice.metadata.points}\n`, fontSize: 10, color: '#7C3AED', bold: true });
  }
  detailsColumn.push({ text: `Estado: Pagado`, fontSize: 10, color: '#2ECC71', bold: true });

  const documentDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      {
        columns: [
          {
            text: 'LifeScore',
            fontSize: 28,
            bold: true,
            color: '#7C3AED',
          },
          {
            text: [
              { text: 'FACTURA\n', fontSize: 20, bold: true, color: '#333' },
              { text: `#${invoice.invoice_number}\n`, fontSize: 12, color: '#666' },
              { text: `Fecha: ${new Date(invoice.created_at).toLocaleDateString('es-ES')}`, fontSize: 10, color: '#999' },
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 30],
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#7C3AED' }],
        margin: [0, 0, 0, 20],
      },
      {
        columns: [
          {
            width: '*',
            text: [
              { text: 'Facturado a:\n', fontSize: 10, color: '#999' },
              { text: `${invoice.customer_name}\n`, fontSize: 14, bold: true, color: '#333' },
              { text: `${invoice.customer_email}\n`, fontSize: 10, color: '#666' },
            ],
          },
          {
            width: '*',
            text: detailsColumn,
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 30],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: 'Descripcion', style: 'tableHeader', fillColor: '#7C3AED', color: '#fff' },
              { text: 'Moneda', style: 'tableHeader', fillColor: '#7C3AED', color: '#fff' },
              { text: 'Total', style: 'tableHeader', fillColor: '#7C3AED', color: '#fff', alignment: 'right' },
            ],
            [
              { text: typeLabel, fontSize: 11 },
              { text: invoice.currency, fontSize: 11 },
              { text: `$${Number(invoice.amount).toFixed(2)}`, fontSize: 11, alignment: 'right', bold: true },
            ],
          ],
        },
        margin: [0, 0, 0, 20],
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#eee',
          vLineColor: () => '#eee',
        },
      },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            table: {
              body: [
                [
                  { text: 'Subtotal', fontSize: 10, color: '#666' },
                  { text: `$${Number(invoice.amount).toFixed(2)}`, fontSize: 10, alignment: 'right' },
                ],
                [
                  { text: 'Impuestos', fontSize: 10, color: '#666' },
                  { text: '$0.00', fontSize: 10, alignment: 'right' },
                ],
                [
                  { text: 'Total', fontSize: 14, bold: true, color: '#333' },
                  { text: `$${Number(invoice.amount).toFixed(2)}`, fontSize: 14, bold: true, color: '#7C3AED', alignment: 'right' },
                ],
              ],
            },
            layout: 'noBorders',
          },
        ],
        margin: [0, 0, 0, 40],
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#eee' }],
        margin: [0, 0, 0, 10],
      },
      {
        text: [
          { text: 'Gracias por tu compra. ', fontSize: 10, color: '#999' },
          { text: 'LifeScore - Transforma tus habitos.', fontSize: 10, color: '#7C3AED', italics: true },
        ],
        alignment: 'center',
        margin: [0, 10, 0, 0],
      },
    ],
    defaultStyle: {
      font: 'Roboto',
    },
  };

  const fileName = `invoice_${invoice.invoice_number}.pdf`;
  const filePath = path.join(INVOICES_DIR, fileName);

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(documentDefinition);
      pdfDoc.getBuffer((buffer) => {
        fs.writeFileSync(filePath, buffer);
        resolve(filePath);
      });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF, INVOICES_DIR };
