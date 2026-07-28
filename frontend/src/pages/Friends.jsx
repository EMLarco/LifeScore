import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Title,
  TextInput,
  Grid,
  Card,
  Text,
  Badge,
  Group,
  Button,
  Avatar,
  Box,
  Stack,
  Tabs,
  Loader,
  ActionIcon,
  Tooltip,
  Modal,
  Pagination,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUsers,
  IconSearch,
  IconUserPlus,
  IconUserX,
  IconCheck,
  IconX,
  IconCrown,
  IconTarget,
} from '@tabler/icons-react';
import {
  getAllUsers,
  sendFriendRequest,
  getPendingRequests,
  getFriends,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from '../services/friendsService';
import { createChallenge } from '../services/friendChallengesService';
import FriendChallenges from '../components/friends/FriendChallenges';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends');

  const [modalOpened, setModalOpened] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchFriend, setSearchFriend] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const searchTimeout = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsData, pendingData] = await Promise.allSettled([
        getFriends(),
        getPendingRequests(),
      ]);
      if (friendsData.status === 'fulfilled') setFriends(friendsData.value);
      if (pendingData.status === 'fulfilled') setPending(pendingData.value);
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [friendsData, pendingData] = await Promise.allSettled([
          getFriends(),
          getPendingRequests(),
        ]);
        if (!cancelled) {
          if (friendsData.status === 'fulfilled') setFriends(friendsData.value);
          if (pendingData.status === 'fulfilled') setPending(pendingData.value);
        }
      } catch (err) {
        console.error('Error loading friends:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const fetchAllUsers = async (page = 1, search = '') => {
    setLoadingUsers(true);
    try {
      const res = await getAllUsers(page, 10, search);
      setAllUsers(res.data);
      setUsersPagination(res.pagination);
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudieron cargar usuarios', color: 'red' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const openAddFriendModal = () => {
    setModalOpened(true);
    fetchAllUsers(1, '');
  };

  const handleSearchInModal = (value) => {
    setSearchFriend(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchAllUsers(1, value);
    }, 300);
  };

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      notifications.show({ message: 'Solicitud enviada', color: 'green' });
      setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      notifications.show({ message: err.response?.data?.message || 'Error', color: 'red' });
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptFriendRequest(id);
      notifications.show({ message: 'Solicitud aceptada', color: 'green' });
      setPending((prev) => prev.filter((p) => p.id !== id));
      loadData();
    } catch {
      notifications.show({ message: 'Error', color: 'red' });
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectFriendRequest(id);
      setPending((prev) => prev.filter((p) => p.id !== id));
    } catch {
      notifications.show({ message: 'Error', color: 'red' });
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeFriend(id);
      notifications.show({ message: 'Amigo eliminado', color: 'yellow' });
      setFriends((prev) => prev.filter((f) => f.id !== id));
    } catch {
      notifications.show({ message: 'Error', color: 'red' });
    }
  };

  const handleChallenge = async (friend) => {
    try {
      await createChallenge({
        challenged_id: friend.id,
        title: `Reto de ${friend.username || friend.name}`,
        description: 'Retame a completar mas habitos que yo hoy',
        points_wagered: 50,
      });
      notifications.show({ message: `Reto enviado a ${friend.username || friend.name}`, color: 'violet' });
    } catch (err) {
      notifications.show({ message: err.response?.data?.message || 'Error', color: 'red' });
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Text c="dimmed">Cargando amigos...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Paper className="paper-clean" p="xl">
        <Group justify="space-between" mb="lg">
          <Title order={1}>
            <IconUsers size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Amigos
          </Title>
          <Button leftSection={<IconUserPlus size={16} />} onClick={openAddFriendModal} color="violet">
            Agregar amigo
          </Button>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="friends">Mis Amigos ({friends.length})</Tabs.Tab>
            <Tabs.Tab value="pending">
              Solicitudes ({pending.length})
              {pending.length > 0 && <Badge size="xs" color="red" ml="xs">{pending.length}</Badge>}
            </Tabs.Tab>
            <Tabs.Tab value="challenges">Desafios</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="friends" pt="md">
            {friends.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No tienes amigos aun. Haz clic en "Agregar amigo" para buscar.
              </Text>
            ) : (
              <Grid>
                {friends.map((friend) => (
                  <Grid.Col key={friend.id} span={{ base: 12, sm: 6 }}>
                    <Card className="card-stat">
                      <Group justify="space-between">
                        <Group>
                          <Avatar size="lg" color="violet" radius="xl">
                            {friend.name?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                          <Box>
                            <Group gap="xs">
                              <Text fw={600}>{friend.name}</Text>
                              {friend.is_premium && (
                                <IconCrown size={14} color="#FBBF24" />
                              )}
                            </Group>
                            <Text size="xs" c="dimmed">
                              @{friend.username}#{friend.tag} · Nv. {friend.level}
                            </Text>
                          </Box>
                        </Group>
                        <Group gap="xs">
                          <Tooltip label="Retar">
                            <ActionIcon
                              variant="light"
                              color="violet"
                              onClick={() => handleChallenge(friend)}
                            >
                              <IconTarget size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Eliminar">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleRemove(friend.id)}
                            >
                              <IconUserX size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="pending" pt="md">
            {pending.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No tienes solicitudes pendientes
              </Text>
            ) : (
              <Stack gap="sm">
                {pending.map((req) => (
                  <Card key={req.id} className="card-stat">
                    <Group justify="space-between">
                      <Group>
                        <Avatar size="md" color="orange" radius="xl">
                          {req.name?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                        <Box>
                          <Text fw={600} size="sm">{req.name}</Text>
                          <Text size="xs" c="dimmed">@{req.username}#{req.tag}</Text>
                        </Box>
                      </Group>
                      <Group gap="xs">
                        <ActionIcon
                          variant="filled"
                          color="green"
                          onClick={() => handleAccept(req.id)}
                        >
                          <IconCheck size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="filled"
                          color="red"
                          onClick={() => handleReject(req.id)}
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="challenges" pt="md">
            <FriendChallenges />
          </Tabs.Panel>
        </Tabs>
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={() => { setModalOpened(false); setSearchFriend(''); setAllUsers([]); }}
        title="Agregar amigo"
        centered
        size="lg"
      >
        <TextInput
          placeholder="Buscar por nombre, usuario o tag..."
          value={searchFriend}
          onChange={(e) => handleSearchInModal(e.target.value)}
          leftSection={<IconSearch size={16} />}
          mb="md"
        />
        {loadingUsers ? (
          <Center py="xl"><Loader size="sm" /></Center>
        ) : allUsers.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No se encontraron usuarios</Text>
        ) : (
          <Stack gap="sm">
            {allUsers.map((u) => (
              <Card key={u.id} className="card-stat" p="sm">
                <Group justify="space-between">
                  <Group>
                    <Avatar color="violet">{u.name[0]}</Avatar>
                    <div>
                      <Text fw={600}>{u.name}</Text>
                      <Group gap="xs">
                        <Badge color="gray" size="sm">@{u.username}</Badge>
                        <Badge color="gray" size="sm">#{u.tag}</Badge>
                        <Badge color="violet" size="sm">Nivel {u.level}</Badge>
                      </Group>
                    </div>
                  </Group>
                  <Button
                    size="xs"
                    color="violet"
                    onClick={() => handleSendRequest(u.id)}
                  >
                    Agregar
                  </Button>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
        <Center mt="md">
          <Pagination
            total={usersPagination.totalPages || 1}
            value={usersPagination.page || 1}
            onChange={(page) => fetchAllUsers(page, searchFriend)}
            color="violet"
          />
        </Center>
      </Modal>
    </Container>
  );
};

export default Friends;
