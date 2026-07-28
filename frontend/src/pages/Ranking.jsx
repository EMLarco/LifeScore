import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Tabs,
  Table,
  Avatar,
  Badge,
  Loader,
  Text,
  Group,
  Box,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axiosConfig';
import { IconTrophy, IconUsers, IconWorld } from '@tabler/icons-react';

const Ranking = () => {
  const { user } = useAuth();
  const [globalRanking, setGlobalRanking] = useState([]);
  const [friendsRanking, setFriendsRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global');

  useEffect(() => {
    let cancelled = false;
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const [globalRes, friendsRes] = await Promise.allSettled([
          api.get('/ranking/global?limit=20'),
          api.get('/ranking/friends?limit=20'),
        ]);
        if (!cancelled) {
          if (globalRes.status === 'fulfilled') setGlobalRanking(globalRes.value.data.data);
          if (friendsRes.status === 'fulfilled') setFriendsRanking(friendsRes.value.data.data);
        }
      } catch {
        // errors handled by Promise.allSettled
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRanking();
    return () => { cancelled = true; };
  }, []);

  const renderTable = (data) => (
    <Table highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>#</Table.Th>
          <Table.Th>Usuario</Table.Th>
          <Table.Th>Nivel</Table.Th>
          <Table.Th>Puntos</Table.Th>
          <Table.Th>XP Total</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data.map((u, index) => {
          const isCurrentUser = u.id === user?.id;
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
          return (
            <Table.Tr
              key={u.id}
              style={isCurrentUser ? { backgroundColor: 'rgba(124, 58, 237, 0.15)' } : {}}
            >
              <Table.Td>
                {medal || `#${index + 1}`}
              </Table.Td>
              <Table.Td>
                <Group gap="sm">
                  <Avatar size="sm" radius="xl" color="violet">
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </Avatar>
                  <Box>
                    <Group gap="xs">
                      <Text size="sm" fw={600}>{u.name}</Text>
                      {isCurrentUser && <Badge color="violet" size="xs">Tu</Badge>}
                    </Group>
                    <Text size="xs" c="dimmed">@{u.username}#{u.tag}</Text>
                  </Box>
                </Group>
              </Table.Td>
              <Table.Td><Badge color="violet">{u.level}</Badge></Table.Td>
              <Table.Td><Badge color="gold">{u.points}</Badge></Table.Td>
              <Table.Td>{u.total_xp}</Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );

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
        <Title order={1} mb="lg">
          <IconTrophy size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Ranking
        </Title>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="global" leftSection={<IconWorld size={16} />}>
              Global
            </Tabs.Tab>
            <Tabs.Tab value="friends" leftSection={<IconUsers size={16} />}>
              Amigos
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="global" pt="md">
            {globalRanking.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No hay usuarios registrados aun.
              </Text>
            ) : (
              renderTable(globalRanking)
            )}
          </Tabs.Panel>

          <Tabs.Panel value="friends" pt="md">
            {friendsRanking.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No tienes amigos o no han ganado puntos aun.
              </Text>
            ) : (
              renderTable(friendsRanking)
            )}
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
};

export default Ranking;
