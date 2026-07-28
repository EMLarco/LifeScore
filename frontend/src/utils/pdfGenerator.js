import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { getAuditData } from '../services/auditService';
import { notifications } from '@mantine/notifications';

pdfMake.addVirtualFileSystem(pdfFonts);
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};

export const generateAuditPDF = async () => {
  try {
    const data = await getAuditData();

    const statRow1 = [
      { text: `Total Usuarios: ${data.stats.total_users}`, style: 'statItem' },
      { text: `Premium: ${data.stats.premium_users}`, style: 'statItem' },
      { text: `Habitos Activos: ${data.stats.total_habits}`, style: 'statItem' },
      { text: `Completados Hoy: ${data.todayActivity}`, style: 'statItem' },
    ];

    const statRow2 = [
      { text: `Nivel Promedio: ${Math.round(data.stats.avg_level * 10) / 10}`, style: 'statItem' },
      { text: `Puntos Promedio: ${Math.round(data.stats.avg_points)}`, style: 'statItem' },
      { text: `2FA Activado: ${data.stats.users_with_2fa}`, style: 'statItem' },
      { text: `Nuevos este mes: ${data.newUsersThisMonth}`, style: 'statItem' },
    ];

    const topHabitsBody = [
      [
        { text: 'Habito', style: 'tableHeader' },
        { text: 'Completados', style: 'tableHeader' },
        { text: '% del Total', style: 'tableHeader' },
      ],
      ...data.topHabits.map((h, i) => {
        const total = data.stats.total_completions || 1;
        const percent = Math.round((h.completions / total) * 100);
        return [
          { text: `${i + 1}. ${h.title}` },
          { text: `${h.completions}`, alignment: 'center' },
          { text: `${percent}%`, alignment: 'center' },
        ];
      }),
    ];

    const activityBody = [
      [
        { text: 'Fecha', style: 'tableHeader' },
        { text: 'Usuario', style: 'tableHeader' },
        { text: 'Habito', style: 'tableHeader' },
      ],
      ...data.activity.map((act) => [
        { text: new Date(act.completed_at).toLocaleString(), fontSize: 9 },
        { text: `${act.user_name} (@${act.username})` },
        { text: act.habit_title },
      ]),
    ];

    const usersBody = [
      [
        { text: 'ID', style: 'tableHeader' },
        { text: 'Nombre', style: 'tableHeader' },
        { text: 'Usuario', style: 'tableHeader' },
        { text: 'Nivel', style: 'tableHeader' },
        { text: 'Puntos', style: 'tableHeader' },
        { text: 'Premium', style: 'tableHeader' },
        { text: '2FA', style: 'tableHeader' },
      ],
      ...data.users.slice(0, 30).map((u) => [
        { text: `${u.id}`, alignment: 'center' },
        { text: u.name },
        { text: `@${u.username || ''}#${u.tag || ''}` },
        { text: `${u.level}`, alignment: 'center' },
        { text: `${u.points}`, alignment: 'center' },
        { text: u.is_premium ? 'Si' : 'No', alignment: 'center' },
        { text: u.two_factor_enabled ? 'Si' : 'No', alignment: 'center' },
      ]),
    ];

    const fs = data.financialSummary || {};
    const financialStatRow = [
      { text: `Ingresos totales: $${Number(fs.total_income || 0).toFixed(2)}`, style: 'statItem' },
      { text: `Retiros pagados: $${Number(fs.total_withdrawn || 0).toFixed(2)}`, style: 'statItem' },
      { text: `Facturas pagadas: ${fs.total_paid_invoices || 0}`, style: 'statItem' },
      { text: `Retiros procesados: ${fs.total_paid_withdrawals || 0}`, style: 'statItem' },
    ];

    const subscriptionsBody = [
      [
        { text: 'ID', style: 'tableHeader' },
        { text: 'Usuario', style: 'tableHeader' },
        { text: 'Plan', style: 'tableHeader' },
        { text: 'Estado', style: 'tableHeader' },
        { text: 'Monto', style: 'tableHeader' },
        { text: 'Inicio', style: 'tableHeader' },
        { text: 'Fin', style: 'tableHeader' },
      ],
      ...(data.subscriptions || []).slice(0, 50).map((s) => [
        { text: `${s.id}`, alignment: 'center' },
        { text: `${s.name} (${s.email})` },
        { text: s.plan_name || s.plan_id || '—' },
        { text: s.status, alignment: 'center' },
        { text: `$${Number(s.amount || 0).toFixed(2)}`, alignment: 'right' },
        { text: s.start_date ? new Date(s.start_date).toLocaleDateString() : '—' },
        { text: s.end_date ? new Date(s.end_date).toLocaleDateString() : '—' },
      ]),
    ];

    const withdrawalsBody = [
      [
        { text: 'ID', style: 'tableHeader' },
        { text: 'Usuario', style: 'tableHeader' },
        { text: 'Puntos', style: 'tableHeader' },
        { text: 'Monto USD', style: 'tableHeader' },
        { text: 'Estado', style: 'tableHeader' },
        { text: 'Fecha', style: 'tableHeader' },
      ],
      ...(data.withdrawals || []).slice(0, 50).map((w) => [
        { text: `${w.id}`, alignment: 'center' },
        { text: `${w.name} (${w.email})` },
        { text: `${w.points}`, alignment: 'center' },
        { text: `$${Number(w.amount_usd || 0).toFixed(2)}`, alignment: 'right' },
        { text: w.status, alignment: 'center' },
        { text: new Date(w.created_at).toLocaleDateString() },
      ]),
    ];

    const auditLogsBody = [
      [
        { text: 'Fecha', style: 'tableHeader' },
        { text: 'Usuario', style: 'tableHeader' },
        { text: 'Accion', style: 'tableHeader' },
        { text: 'Entidad', style: 'tableHeader' },
        { text: 'Detalles', style: 'tableHeader' },
      ],
      ...(data.auditLogs || []).slice(0, 100).map((log) => [
        { text: new Date(log.created_at).toLocaleString(), fontSize: 9 },
        { text: `${log.name || 'Sistema'} (${log.email || '—'})`, fontSize: 9 },
        { text: log.action, fontSize: 9 },
        { text: log.entity_type, fontSize: 9 },
        { text: JSON.stringify(log.details || {}).slice(0, 80) + '...', fontSize: 8 },
      ]),
    ];

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 60, 40, 40],
      header: function (currentPage, pageCount) {
        return {
          columns: [
            {
              text: 'LS',
              style: 'logoText',
              margin: [40, 12, 0, 0],
            },
            {
              text: 'LifeScore - Auditoria del Sistema',
              style: 'headerTitle',
              margin: [0, 18, 0, 0],
            },
            {
              text: `Pag. ${currentPage} / ${pageCount}`,
              alignment: 'right',
              fontSize: 9,
              color: '#868E96',
              margin: [0, 20, 40, 0],
            },
          ],
          columnGap: 10,
        };
      },
      footer: function () {
        return {
          text: `LifeScore Auditoria - ${new Date().getFullYear()}`,
          alignment: 'center',
          fontSize: 8,
          color: '#868E96',
          margin: [0, 10, 0, 0],
        };
      },
      content: [
        { text: 'Auditoria del Sistema', style: 'mainTitle' },
        {
          text: `Generado: ${new Date(data.generatedAt).toLocaleString()} | Version: ${data.appVersion}`,
          style: 'subTitle',
        },
        { text: ' ' },

        { text: 'Resumen Ejecutivo', style: 'sectionTitle' },
        {
          columns: statRow1,
          columnGap: 8,
          margin: [0, 5, 0, 5],
        },
        {
          columns: statRow2,
          columnGap: 8,
          margin: [0, 5, 0, 10],
        },

        { text: 'Top 10 Habitos Mas Completados', style: 'sectionTitle' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: topHabitsBody,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 15],
        },

        { text: 'Actividad Reciente (ultimos 50 eventos)', style: 'sectionTitle' },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', '*'],
            body: activityBody,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 15],
          fontSize: 10,
        },

        { text: `Usuarios Registrados (${data.users.length} total)`, style: 'sectionTitle' },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', '*', 'auto', 'auto', 'auto', 'auto'],
            body: usersBody,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 10],
          fontSize: 10,
        },
        ...(data.users.length > 30
          ? [{ text: `... y ${data.users.length - 30} usuarios mas.`, style: 'footnote' }]
          : []),

        { text: ' ' },
        { text: 'Resumen Financiero', style: 'sectionTitle' },
        {
          columns: financialStatRow,
          columnGap: 8,
          margin: [0, 5, 0, 10],
        },

        { text: `Suscripciones (${(data.subscriptions || []).length} registros)`, style: 'sectionTitle' },
        ...(data.subscriptions && data.subscriptions.length > 0 ? [{
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: subscriptionsBody,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 15],
          fontSize: 9,
        }] : [{ text: 'No hay suscripciones registradas.', style: 'footnote' }]),

        { text: `Retiros de Puntos (${(data.withdrawals || []).length} registros)`, style: 'sectionTitle' },
        ...(data.withdrawals && data.withdrawals.length > 0 ? [{
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'],
            body: withdrawalsBody,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 15],
          fontSize: 9,
        }] : [{ text: 'No hay retiros registrados.', style: 'footnote' }]),

        { text: `Auditoria de Acciones (${(data.auditLogs || []).length} registros)`, style: 'sectionTitle' },
        ...(data.auditLogs && data.auditLogs.length > 0 ? [{
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', '*'],
            body: auditLogsBody,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 15],
          fontSize: 9,
        }] : [{ text: 'No hay logs de auditoria.', style: 'footnote' }]),

        { text: ' ' },
        {
          text: `Auditoria generada automaticamente por LifeScore. Todos los derechos reservados. ${new Date().getFullYear()}`,
          style: 'footer',
        },
      ],
      styles: {
        headerTitle: {
          fontSize: 14,
          bold: true,
          color: '#7C3AED',
          alignment: 'center',
        },
        logoText: {
          fontSize: 16,
          bold: true,
          color: '#FFFFFF',
          fillColor: '#7C3AED',
          alignment: 'center',
        },
        mainTitle: {
          fontSize: 22,
          bold: true,
          alignment: 'center',
          color: '#1A1B2E',
          margin: [0, 10, 0, 5],
        },
        subTitle: {
          fontSize: 11,
          alignment: 'center',
          color: '#5A5A72',
          margin: [0, 2, 0, 2],
        },
        sectionTitle: {
          fontSize: 14,
          bold: true,
          color: '#7C3AED',
          margin: [0, 12, 0, 6],
        },
        statItem: {
          fontSize: 11,
          bold: true,
          color: '#1A1B2E',
        },
        tableHeader: {
          bold: true,
          color: '#FFFFFF',
          fillColor: '#7C3AED',
          alignment: 'center',
          fontSize: 10,
        },
        footnote: {
          fontSize: 9,
          italics: true,
          color: '#868E96',
          margin: [0, 5, 0, 5],
        },
        footer: {
          fontSize: 9,
          alignment: 'center',
          color: '#868E96',
        },
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Auditoria_LifeScore_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notifications.show({
        title: 'PDF generado',
        message: 'La auditoria se ha exportado correctamente',
        color: 'green',
      });
    });
  } catch (error) {
    console.error('Error generando auditoria:', error);
    notifications.show({
      title: 'Error',
      message: error.message || 'No se pudo generar la auditoria',
      color: 'red',
    });
  }
};
