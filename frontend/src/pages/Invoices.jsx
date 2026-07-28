import { useState, useEffect } from 'react';
import { Container, Paper, Title, Table, Button, Loader, Text, Group, Badge, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../api/axiosConfig';
import { IconMail, IconDownload, IconReceipt } from '@tabler/icons-react';

const TYPE_LABELS = {
  subscription: 'Suscripcion',
  points: 'Puntos',
  skin: 'Skin',
};

const Invoices = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/transactions');
        setTransactions(res.data.data);
      } catch {
        notifications.show({ title: 'Error', message: 'No se pudieron cargar las transacciones', color: 'red' });
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleResend = async (transactionId) => {
    setSending(transactionId);
    try {
      await api.post(`/transactions/${transactionId}/send-invoice`);
      notifications.show({
        title: 'Factura enviada',
        message: 'Revisa tu correo electronico',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo enviar la factura',
        color: 'red',
      });
    } finally {
      setSending(null);
    }
  };

  const handleDownload = async (transactionId) => {
    setDownloading(transactionId);
    try {
      const res = await api.get(`/transactions/${transactionId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LifeScore_Invoice_${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo descargar la factura',
        color: 'red',
      });
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl" ta="center">
        <Loader size="xl" color="violet" />
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" radius="lg" p="xl">
        <Group mb="lg">
          <Title order={1}>
            <IconReceipt size={28} color="#8B5CF6" style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Mis Facturas
          </Title>
        </Group>
        <Text c="dimmed" mb="xl">
          Visualiza, descarga y reenvia tus facturas de todas tus transacciones.
        </Text>

        {transactions.length === 0 ? (
          <Stack align="center" py="xl" gap="md">
            <IconReceipt size={48} color="var(--text-secondary)" style={{ opacity: 0.4 }} />
            <Title order={3} c="dimmed">No tienes transacciones</Title>
            <Text c="dimmed" size="sm">Realiza una compra para generar tu primera factura.</Text>
          </Stack>
        ) : (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Detalle</Table.Th>
                <Table.Th>Monto</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Fecha</Table.Th>
                <Table.Th ta="right">Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {transactions.map((tx) => (
                <Table.Tr key={tx.id}>
                  <Table.Td fw={600}>#{tx.id}</Table.Td>
                  <Table.Td>
                    <Badge color="violet" variant="light" size="sm">
                      {TYPE_LABELS[tx.type] || tx.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {tx.plan || '—'}
                    {tx.metadata?.points ? ` (${tx.metadata.points} pts)` : ''}
                  </Table.Td>
                  <Table.Td fw={600}>${Number(tx.amount).toFixed(2)} {tx.currency}</Table.Td>
                  <Table.Td>
                    <Badge color={tx.status === 'completed' ? 'green' : 'orange'} variant="light" size="sm">
                      {tx.status === 'completed' ? 'Pagado' : tx.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{new Date(tx.created_at).toLocaleDateString('es-ES')}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <Button
                        size="xs"
                        variant="light"
                        color="violet"
                        leftSection={<IconMail size={14} />}
                        onClick={() => handleResend(tx.id)}
                        loading={sending === tx.id}
                      >
                        Reenviar
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        color="blue"
                        leftSection={<IconDownload size={14} />}
                        onClick={() => handleDownload(tx.id)}
                        loading={downloading === tx.id}
                      >
                        PDF
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default Invoices;
