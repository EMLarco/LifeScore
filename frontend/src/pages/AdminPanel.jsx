import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Title,
  Tabs,
  Text,
  Table,
  Button,
  Badge,
  Group,
  Modal,
  TextInput,
  Switch,
  Grid,
  Card,
  Loader,
  Box,
  ActionIcon,
  Pagination,
  Center,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import api from '../api/axiosConfig';
import {
  IconUsers,
  IconList,
  IconGift,
  IconTrophy,
  IconChartBar,
  IconEdit,
  IconTrash,
  IconPlus,
  IconActivity,
  IconSearch,
  IconFileExport,
} from '@tabler/icons-react';
import { AreaChart } from '@mantine/charts';
import { generateAuditPDF } from '../utils/pdfGenerator';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [habits, setHabits] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const [userList, setUserList] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [userSearch, setUserSearch] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  const [activities, setActivities] = useState([]);
  const [actLoading, setActLoading] = useState(false);

  const [rewardModal, setRewardModal] = useState({ opened: false, editing: null });
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    points_cost: 100,
    icon: '🎁',
    is_premium_reward: false,
    available: true,
  });

  const fetchUsersAdmin = useCallback(async (page = 1, search = '') => {
    setUserLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setUserList(res.data.data);
      setUserPagination(res.data.pagination);
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudieron cargar los usuarios', color: 'red' });
    } finally {
      setUserLoading(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    setActLoading(true);
    try {
      const res = await api.get('/admin/activity');
      setActivities(res.data.data);
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudo cargar la actividad', color: 'red' });
    } finally {
      setActLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'dashboard') {
          const res = await api.get('/admin/stats');
          if (!cancelled) setStats(res.data.data);
        } else if (activeTab === 'users') {
          fetchUsersAdmin(1, '');
        } else if (activeTab === 'activity') {
          fetchActivity();
        } else if (activeTab === 'habits') {
          const res = await api.get('/admin/habits');
          if (!cancelled) setHabits(res.data.data);
        } else if (activeTab === 'rewards') {
          const res = await api.get('/admin/rewards');
          if (!cancelled) setRewards(res.data.data);
        } else if (activeTab === 'achievements') {
          const res = await api.get('/admin/achievements');
          if (!cancelled) setAchievements(res.data.data);
        }
      } catch {
        if (!cancelled) {
          notifications.show({ title: 'Error', message: 'No se pudieron cargar los datos', color: 'red' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [activeTab, fetchUsersAdmin, fetchActivity]);

  const handleExportAudit = async () => {
    setLoading(true);
    try {
      await generateAuditPDF();
    } catch (error) {
      console.error('Error al generar PDF:', error);
      notifications.show({ title: 'Error', message: 'No se pudo generar la auditoria', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const revoke2FA = async (userId) => {
    if (!window.confirm('Revocar 2FA para este usuario?')) return;
    try {
      await api.post(`/admin/users/${userId}/revoke-2fa`);
      notifications.show({ title: '2FA revocado', color: 'green' });
      fetchUsersAdmin(userPagination.page, userSearch);
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudo revocar 2FA', color: 'red' });
    }
  };

  const handleUserSearch = (value) => {
    setUserSearch(value);
    fetchUsersAdmin(1, value);
  };

  const togglePremium = async (userId, currentState) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-premium`);
      notifications.show({
        title: 'Membresia actualizada',
        message: currentState ? 'Usuario ahora es Free' : 'Usuario ahora es Premium',
        color: 'green',
      });
      fetchUsersAdmin(userPagination.page, userSearch);
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudo actualizar', color: 'red' });
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      notifications.show({ title: 'Usuario eliminado', color: 'green' });
      fetchUsersAdmin(userPagination.page, userSearch);
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'No se pudo eliminar', color: 'red' });
    }
  };

  const handleSaveReward = async () => {
    setLoading(true);
    try {
      if (rewardModal.editing) {
        await api.put(`/admin/rewards/${rewardModal.editing}`, rewardForm);
        notifications.show({ title: 'Recompensa actualizada', color: 'green' });
      } else {
        await api.post('/admin/rewards', rewardForm);
        notifications.show({ title: 'Recompensa creada', color: 'green' });
      }
      setRewardModal({ opened: false, editing: null });
      const res = await api.get('/admin/rewards');
      setRewards(res.data.data);
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Error al guardar', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const deleteReward = async (rewardId) => {
    try {
      await api.delete(`/admin/rewards/${rewardId}`);
      notifications.show({ title: 'Recompensa eliminada', color: 'green' });
      const res = await api.get('/admin/rewards');
      setRewards(res.data.data);
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudo eliminar', color: 'red' });
    }
  };

  const openRewardModal = (reward = null) => {
    if (reward) {
      setRewardForm({
        name: reward.name,
        description: reward.description || '',
        points_cost: reward.points_cost,
        icon: reward.icon || '🎁',
        is_premium_reward: reward.is_premium_reward || false,
        available: reward.available !== undefined ? reward.available : true,
      });
      setRewardModal({ opened: true, editing: reward.id });
    } else {
      setRewardForm({
        name: '',
        description: '',
        points_cost: 100,
        icon: '🎁',
        is_premium_reward: false,
        available: true,
      });
      setRewardModal({ opened: true, editing: null });
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      await api.delete(`/admin/habits/${habitId}`);
      notifications.show({ title: 'Habito eliminado', color: 'green' });
      const res = await api.get('/admin/habits');
      setHabits(res.data.data);
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudo eliminar', color: 'red' });
    }
  };

  const renderDashboard = () => (
    <Box>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder style={{ background: 'var(--bg-card)' }}>
            <Text c="dimmed" size="sm">Total Usuarios</Text>
            <Title order={2}>{stats?.totalUsers || 0}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder style={{ background: 'var(--bg-card)' }}>
            <Text c="dimmed" size="sm">Usuarios Premium</Text>
            <Title order={2}>{stats?.totalPremium || 0}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder style={{ background: 'var(--bg-card)' }}>
            <Text c="dimmed" size="sm">Habitos Activos</Text>
            <Title order={2}>{stats?.totalHabits || 0}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder style={{ background: 'var(--bg-card)' }}>
            <Text c="dimmed" size="sm">Total Completados</Text>
            <Title order={2}>{stats?.totalCompleted || 0}</Title>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid mt="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder style={{ background: 'var(--bg-card)' }}>
            <Text fw={600} mb="md">Actividad diaria (ultimos 7 dias)</Text>
            <AreaChart
              h={250}
              data={stats?.dailyLogs || []}
              dataKey="date"
              series={[{ name: 'count', color: '#7C3AED' }]}
              tickLine="xy"
              valueFormatter={(v) => `${v} completados`}
            />
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder style={{ background: 'var(--bg-card)' }}>
            <Text fw={600} mb="md">Top 5 Usuarios</Text>
            {stats?.topUsers?.map((u, i) => (
              <Box key={i} mb="xs">
                <Group justify="space-between">
                  <Text size="sm">{u.name}</Text>
                  <Badge>{u.completed_count} habitos</Badge>
                </Group>
              </Box>
            ))}
          </Card>
        </Grid.Col>
      </Grid>
    </Box>
  );

  const renderUsers = () => (
    <Box>
      <TextInput
        placeholder="Buscar por nombre, email, username o tag..."
        value={userSearch}
        onChange={(e) => handleUserSearch(e.target.value)}
        leftSection={<IconSearch size={16} />}
        mb="md"
      />
      {userLoading ? (
        <Loader size="sm" />
      ) : (
        <>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Username</Table.Th>
                <Table.Th>Tag</Table.Th>
                <Table.Th>Nivel</Table.Th>
                <Table.Th>Puntos</Table.Th>
                <Table.Th>Premium</Table.Th>
                <Table.Th>2FA</Table.Th>
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {userList.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>{u.id}</Table.Td>
                  <Table.Td>{u.name}</Table.Td>
                  <Table.Td>{u.email}</Table.Td>
                  <Table.Td>{u.username}</Table.Td>
                  <Table.Td>#{u.tag}</Table.Td>
                  <Table.Td>{u.level}</Table.Td>
                  <Table.Td>{u.points}</Table.Td>
                  <Table.Td>
                    <Badge color={u.is_premium ? 'gold' : 'gray'}>
                      {u.is_premium ? 'Si' : 'No'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={u.two_factor_enabled ? 'green' : 'red'}>
                      {u.two_factor_enabled ? 'Activado' : 'Desactivado'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        color={u.is_premium ? 'gray' : 'gold'}
                        variant="outline"
                        onClick={() => togglePremium(u.id, u.is_premium)}
                      >
                        {u.is_premium ? 'Quitar' : 'Premium'}
                      </Button>
                      {u.two_factor_enabled && (
                        <Button size="xs" color="red" variant="outline" onClick={() => revoke2FA(u.id)}>
                          Revocar 2FA
                        </Button>
                      )}
                      <ActionIcon color="red" onClick={() => deleteUser(u.id)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Center mt="md">
            <Pagination
              total={userPagination.totalPages}
              value={userPagination.page}
              onChange={(page) => fetchUsersAdmin(page, userSearch)}
              color="violet"
            />
          </Center>
        </>
      )}
    </Box>
  );

  const renderActivity = () => (
    <Box>
      {actLoading ? (
        <Loader size="sm" />
      ) : (
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Usuario</Table.Th>
              <Table.Th>Habito</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {activities.map((act, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>{new Date(act.completed_at).toLocaleString()}</Table.Td>
                <Table.Td>{act.name} (@{act.username})</Table.Td>
                <Table.Td>{act.title}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Box>
  );

  const renderHabits = () => (
    <Box>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Usuario</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {habits.map((h) => (
            <Table.Tr key={h.id}>
              <Table.Td>{h.id}</Table.Td>
              <Table.Td>{h.title}</Table.Td>
              <Table.Td>{h.user_name}</Table.Td>
              <Table.Td>
                <ActionIcon color="red" onClick={() => deleteHabit(h.id)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );

  const renderRewards = () => (
    <Box>
      <Button leftSection={<IconPlus size={16} />} onClick={() => openRewardModal()} mb="md">
        Nueva Recompensa
      </Button>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Descripcion</Table.Th>
            <Table.Th>Coste</Table.Th>
            <Table.Th>Premium</Table.Th>
            <Table.Th>Disponible</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rewards.map((r) => (
            <Table.Tr key={r.id}>
              <Table.Td>{r.id}</Table.Td>
              <Table.Td>{r.name}</Table.Td>
              <Table.Td>{r.description}</Table.Td>
              <Table.Td>{r.points_cost}</Table.Td>
              <Table.Td>
                <Badge color={r.is_premium_reward ? 'gold' : 'gray'}>
                  {r.is_premium_reward ? 'Si' : 'No'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge color={r.available ? 'green' : 'red'}>
                  {r.available ? 'Si' : 'No'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon color="blue" onClick={() => openRewardModal(r)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon color="red" onClick={() => deleteReward(r.id)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={rewardModal.opened}
        onClose={() => setRewardModal({ opened: false, editing: null })}
        title={rewardModal.editing ? 'Editar Recompensa' : 'Nueva Recompensa'}
        centered
      >
        <TextInput
          label="Nombre"
          value={rewardForm.name}
          onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
          mb="md"
        />
        <TextInput
          label="Descripcion"
          value={rewardForm.description}
          onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
          mb="md"
        />
        <TextInput
          label="Coste en puntos"
          type="number"
          value={rewardForm.points_cost}
          onChange={(e) => setRewardForm({ ...rewardForm, points_cost: parseInt(e.target.value) || 0 })}
          mb="md"
        />
        <TextInput
          label="Icono"
          value={rewardForm.icon}
          onChange={(e) => setRewardForm({ ...rewardForm, icon: e.target.value })}
          mb="md"
        />
        <Switch
          label="Recompensa Premium"
          checked={rewardForm.is_premium_reward}
          onChange={(e) => setRewardForm({ ...rewardForm, is_premium_reward: e.currentTarget.checked })}
          mb="md"
        />
        <Switch
          label="Disponible"
          checked={rewardForm.available}
          onChange={(e) => setRewardForm({ ...rewardForm, available: e.currentTarget.checked })}
          mb="md"
        />
        <Button onClick={handleSaveReward} loading={loading}>Guardar</Button>
      </Modal>
    </Box>
  );

  const renderAchievements = () => (
    <Box>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Usuario</Table.Th>
            <Table.Th>Logro</Table.Th>
            <Table.Th>Fecha</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {achievements.map((a) => (
            <Table.Tr key={a.id}>
              <Table.Td>{a.id}</Table.Td>
              <Table.Td>{a.user_name}</Table.Td>
              <Table.Td>{a.achievement_key}</Table.Td>
              <Table.Td>{new Date(a.unlocked_at).toLocaleDateString()}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );

  if (!user?.is_admin) {
    return (
      <Container size="lg" py="xl">
        <Paper shadow="md" radius="lg" p="xl">
          <Title order={2} ta="center">Acceso Denegado</Title>
          <Text ta="center" c="dimmed" mt="md">
            No tienes permisos de administrador para acceder a esta pagina.
          </Text>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Paper shadow="md" radius="lg" p="xl">
        <Group justify="space-between" mb="lg">
          <Box>
            <Title order={1}>Panel de Administracion</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Bienvenido, {user?.name}. Aqui puedes gestionar todo el sistema.
            </Text>
          </Box>
          <Button
            leftSection={<IconFileExport size={18} />}
            variant="gradient"
            gradient={{ from: '#7C3AED', to: '#EC4899' }}
            onClick={handleExportAudit}
            loading={loading}
          >
            Exportar Auditoria (PDF)
          </Button>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="dashboard" leftSection={<IconChartBar size={16} />}>Dashboard</Tabs.Tab>
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>Usuarios</Tabs.Tab>
            <Tabs.Tab value="activity" leftSection={<IconActivity size={16} />}>Actividad</Tabs.Tab>
            <Tabs.Tab value="habits" leftSection={<IconList size={16} />}>Habitos</Tabs.Tab>
            <Tabs.Tab value="rewards" leftSection={<IconGift size={16} />}>Recompensas</Tabs.Tab>
            <Tabs.Tab value="achievements" leftSection={<IconTrophy size={16} />}>Logros</Tabs.Tab>
          </Tabs.List>

          <Box pt="lg">
            {activeTab === 'dashboard' && (loading ? <Loader size="sm" /> : renderDashboard())}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'activity' && renderActivity()}
            {activeTab === 'habits' && (loading ? <Loader size="sm" /> : renderHabits())}
            {activeTab === 'rewards' && (loading ? <Loader size="sm" /> : renderRewards())}
            {activeTab === 'achievements' && (loading ? <Loader size="sm" /> : renderAchievements())}
          </Box>
        </Tabs>
      </Paper>
    </Container>
  );
};

export default AdminPanel;
