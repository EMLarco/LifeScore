import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Table,
  Button,
  Loader,
  Text,
  Group,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../api/axiosConfig';
import { IconDeviceDesktop, IconTrash, IconHistory } from '@tabler/icons-react';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sessions');
      setSessions(res.data.data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
      notifications.show({ color: 'green', message: 'Sesion cerrada' });
      fetchSessions();
    } catch {
      notifications.show({ color: 'red', message: 'Error al cerrar sesion' });
    }
  };

  const handleRevokeAll = async () => {
    try {
      await api.delete('/sessions');
      notifications.show({ color: 'green', message: 'Todas las sesiones cerradas' });
      fetchSessions();
    } catch {
      notifications.show({ color: 'red', message: 'Error al cerrar sesiones' });
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Loader size="xl" />
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Paper className="paper-clean" p="xl">
        <Group justify="space-between" mb="lg">
          <Title order={1}>
            <IconHistory size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Historial de Sesiones
          </Title>
          {sessions.length > 0 && (
            <Button color="red" variant="light" size="xs" onClick={handleRevokeAll}>
              Cerrar todas
            </Button>
          )}
        </Group>

        {sessions.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No hay sesiones registradas.</Text>
        ) : (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Dispositivo</Table.Th>
                <Table.Th>IP</Table.Th>
                <Table.Th>Inicio</Table.Th>
                <Table.Th>Actividad</Table.Th>
                <Table.Th>Accion</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sessions.map((s) => (
                <Table.Tr
                  key={s.id}
                  style={s.is_current ? { backgroundColor: 'rgba(124, 58, 237, 0.1)' } : {}}
                >
                  <Table.Td>
                    <Group gap="xs">
                      <IconDeviceDesktop size={16} />
                      <Text size="sm">{s.device_info || 'Desconocido'}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm">{s.ip_address || 'N/A'}</Text></Table.Td>
                  <Table.Td>
                    <Badge color="green" variant="light">
                      {new Date(s.created_at).toLocaleDateString()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="blue" variant="light">
                      {new Date(s.last_activity).toLocaleString()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {s.is_current ? (
                      <Badge color="green" variant="filled" size="sm">Sesion actual</Badge>
                    ) : (
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleRevoke(s.id)}
                      >
                        Cerrar
                      </Button>
                    )}
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

export default Sessions;
