import { useState, useEffect } from 'react';
import {
  Container, Paper, Title, Text, Group, Stack, Card, Button,
  NumberInput, Badge, Loader, Divider, Table, Alert,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import api from '../api/axiosConfig';
import { IconCoin, IconCash, IconAlertCircle } from '@tabler/icons-react';

const POINTS_TO_USD_RATE = 0.0015;
const MIN_WITHDRAWAL = 5000;
const MAX_WITHDRAWAL = 100000;
const PLATFORM_FEE = 0.10;

const STATUS_MAP = {
  paid: { label: 'Pagado', color: 'green' },
  approved: { label: 'Aprobado', color: 'blue' },
  rejected: { label: 'Rechazado', color: 'red' },
  pending: { label: 'Pendiente', color: 'orange' },
};

const Withdrawals = () => {
  const { user, updateUser } = useAuth();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/withdrawals');
        setHistory(res.data.data);
      } catch (error) {
        console.error('Error fetching withdrawal history:', error);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const calculateAmount = (pts) => {
    const num = parseInt(pts) || 0;
    if (num < MIN_WITHDRAWAL) return { gross: 0, fee: 0, net: 0 };
    const gross = num * POINTS_TO_USD_RATE;
    const fee = gross * PLATFORM_FEE;
    return { gross, fee, net: gross - fee };
  };

  const handleSubmit = async () => {
    const pts = parseInt(points);
    if (!pts || pts < MIN_WITHDRAWAL) {
      notifications.show({ title: 'Error', message: `Minimo ${MIN_WITHDRAWAL} puntos`, color: 'red' });
      return;
    }
    if (pts > MAX_WITHDRAWAL) {
      notifications.show({ title: 'Error', message: `Maximo ${MAX_WITHDRAWAL} puntos por solicitud`, color: 'red' });
      return;
    }
    if (pts > (user?.points || 0)) {
      notifications.show({ title: 'Error', message: 'No tienes suficientes puntos', color: 'red' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/withdrawals', { points: pts });
      notifications.show({ title: 'Solicitud enviada', message: 'Espera la aprobacion del administrador', color: 'green' });
      setPoints(0);
      const res = await api.get('/withdrawals');
      setHistory(res.data.data);
      if (updateUser) updateUser({ ...user, points: (user.points || 0) - pts });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al solicitar retiro',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const { gross, fee, net } = calculateAmount(points);

  return (
    <Container size="lg" py="xl">
      <Paper p="xl">
        <Title order={1} mb="lg">Retirar Puntos</Title>

        <Group mb="xl">
          <Card p="md" style={{ flex: 1, background: 'var(--bg-card)' }}>
            <Group>
              <IconCoin size={24} color="gold" />
              <div>
                <Text c="dimmed" size="sm">Puntos disponibles</Text>
                <Text size="xl" fw={700}>{user?.points || 0}</Text>
              </div>
            </Group>
          </Card>
          <Card p="md" style={{ flex: 1, background: 'var(--bg-card)' }}>
            <Group>
              <IconCash size={24} color="green" />
              <div>
                <Text c="dimmed" size="sm">Valor aproximado</Text>
                <Text size="xl" fw={700}>${((user?.points || 0) * POINTS_TO_USD_RATE).toFixed(2)}</Text>
              </div>
            </Group>
          </Card>
        </Group>

        <Alert icon={<IconAlertCircle size={16} />} color="blue" mb="md">
          <Text size="sm">
            Tasa de conversion: 1000 puntos = ${(1000 * POINTS_TO_USD_RATE).toFixed(2)} USD
            <br />
            Comision de plataforma: {PLATFORM_FEE * 100}%
            <br />
            Minimo: {MIN_WITHDRAWAL} puntos (${(MIN_WITHDRAWAL * POINTS_TO_USD_RATE * (1 - PLATFORM_FEE)).toFixed(2)} USD)
            <br />
            Maximo por solicitud: {MAX_WITHDRAWAL} puntos
          </Text>
        </Alert>

        <Stack>
          <NumberInput
            label="Puntos a canjear"
            placeholder="Ej. 5000"
            value={points}
            onChange={(val) => setPoints(val)}
            min={MIN_WITHDRAWAL}
            max={MAX_WITHDRAWAL}
            step={1000}
          />
          {points >= MIN_WITHDRAWAL && (
            <Group>
              <Badge color="gray">Bruto: ${gross.toFixed(2)}</Badge>
              <Badge color="red">Comision: -${fee.toFixed(2)}</Badge>
              <Badge color="green" size="lg">Neto: ${net.toFixed(2)}</Badge>
            </Group>
          )}
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!points || points < MIN_WITHDRAWAL || points > (user?.points || 0)}
            variant="gradient"
            gradient={{ from: '#7C3AED', to: '#EC4899' }}
          >
            Solicitar Retiro
          </Button>
        </Stack>

        <Divider my="xl" />

        <Title order={3} mb="md">Historial de Retiros</Title>
        {historyLoading ? (
          <Loader size="sm" />
        ) : history.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No has solicitado retiros aun.</Text>
        ) : (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Puntos</Table.Th>
                <Table.Th>Monto</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {history.map((w) => {
                const s = STATUS_MAP[w.status] || STATUS_MAP.pending;
                return (
                  <Table.Tr key={w.id}>
                    <Table.Td>{new Date(w.created_at).toLocaleDateString()}</Table.Td>
                    <Table.Td>{w.points}</Table.Td>
                    <Table.Td>${Number(w.amount_usd).toFixed(2)}</Table.Td>
                    <Table.Td><Badge color={s.color}>{s.label}</Badge></Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default Withdrawals;
