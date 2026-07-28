import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Avatar,
  Badge,
  SimpleGrid,
  Box,
  Button,
  FileInput,
  Stack,
  Card,
  CardSection,
  Loader,
  ThemeIcon,
  Divider,
  Tooltip,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { IconFlame, IconCoin, IconUpload, IconPalette, IconStar, IconTrophy, IconTarget, IconCheck, IconCrown, IconRocket, IconSun, IconBook, IconMoodSmile, IconFileExport } from '@tabler/icons-react';
import api from '../api/axiosConfig';

const badgeIcons = {
  IconSun: IconSun,
  IconTarget: IconTarget,
  IconCheck: IconCheck,
  IconFlame: IconFlame,
  IconBook: IconBook,
  IconMoodSmile: IconMoodSmile,
  IconCrown: IconCrown,
  IconRocket: IconRocket,
  IconStar: IconStar,
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [badges, setBadges] = useState([]);
  const [challengeStats, setChallengeStats] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [bannersRes, badgesRes, statsRes] = await Promise.allSettled([
          api.get('/profile/banners'),
          api.get('/badges'),
          api.get('/challenges/stats'),
        ]);
        if (bannersRes.status === 'fulfilled') setBanners(bannersRes.value.data.data);
        if (badgesRes.status === 'fulfilled') setBadges(badgesRes.value.data.data || []);
        if (statsRes.status === 'fulfilled') setChallengeStats(statsRes.value.data.data);
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: error.response?.data?.message || 'No se pudieron cargar los datos del perfil',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...user, avatar_url: res.data.data.avatar_url });
      notifications.show({
        title: 'Exito',
        message: 'Avatar actualizado',
        color: 'green',
      });
      setAvatarFile(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo subir el avatar',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSelectBanner = async (bannerId) => {
    try {
      await api.put('/profile', { banner_id: bannerId });
      const banner = banners.find((b) => b.id === bannerId);
      updateUser({ ...user, banner_url: banner?.image_url, banner_id: bannerId });
      notifications.show({
        title: 'Exito',
        message: 'Banner actualizado',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo cambiar el banner',
        color: 'red',
      });
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
        {user?.banner_url && (
          <Box
            mb="xl"
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              height: 200,
              backgroundImage: `url(${user.banner_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.6))',
              }}
            />
          </Box>
        )}

        <Group align="flex-start" gap="xl">
          <Stack align="center" gap="sm">
            <Avatar
              src={user?.avatar_url}
              size={120}
              radius={120}
              color="violet"
              style={{ border: '3px solid #7C3AED' }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <FileInput
              label="Nueva foto"
              placeholder="Seleccionar imagen"
              accept="image/png,image/jpeg,image/gif,image/webp"
              value={avatarFile}
              onChange={setAvatarFile}
              size="xs"
              icon={<IconUpload size={14} />}
            />
            <Button
              onClick={handleAvatarUpload}
              leftSection={<IconUpload size={16} />}
              size="xs"
              loading={uploading}
              disabled={!avatarFile}
            >
              Actualizar
            </Button>
          </Stack>

          <Stack flex={1} gap="md">
            <div>
              <Group>
                <Title order={2}>{user?.name}</Title>
                {user?.is_premium && (
                  <Badge color="gold" size="lg" leftSection={<IconCrown size={14} />}>
                    Premium
                  </Badge>
                )}
              </Group>
              <Text c="dimmed">{user?.email}</Text>
            </div>
            <Group>
              <Badge color="violet" size="lg" leftSection={<IconTarget size={14} />}>
                Nivel {user?.level || 1}
              </Badge>
              <Badge color="green" size="lg">
                {user?.total_xp || 0} XP
              </Badge>
              <Badge color="gold" size="lg" leftSection={<IconCoin size={14} />}>
                {user?.points || 0} pts
              </Badge>
              <Badge color="orange" size="lg" leftSection={<IconFlame size={14} />}>
                Racha: {user?.daily_streak || 0}
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Paper className="card-stat" p="md">
                <Text c="dimmed" size="sm">Habitos creados</Text>
                <Text size="xl" fw={700}>{user?.habits_count || 0}</Text>
              </Paper>
              <Paper className="card-stat" p="md">
                <Text c="dimmed" size="sm">Racha maxima</Text>
                <Text size="xl" fw={700}>{user?.max_streak || 0}</Text>
              </Paper>
            </SimpleGrid>

            <Text size="sm" c="dimmed">
              Miembro desde: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </Text>
          </Stack>
        </Group>

        {challengeStats && (
          <>
            <Divider my="xl" />
            <Title order={3} mb="md">
              <IconTrophy size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Estadisticas de Retos
            </Title>
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              <Paper className="card-stat" p="md">
                <Text c="dimmed" size="sm">Total completados</Text>
                <Text size="xl" fw={700}>{challengeStats.total}</Text>
              </Paper>
              {challengeStats.by_type?.map((item) => (
                <Paper key={item.type} className="card-stat" p="md">
                  <Text c="dimmed" size="sm" style={{ textTransform: 'capitalize' }}>{item.type}</Text>
                  <Text size="xl" fw={700}>{item.count}</Text>
                </Paper>
              ))}
            </SimpleGrid>
          </>
        )}

        {badges.length > 0 && (
          <>
            <Divider my="xl" />
            <Title order={3} mb="md">
              <IconStar size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Insignias ({badges.length})
            </Title>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }}>
              {badges.map((badge) => {
                const IconComponent = badgeIcons[badge.icon] || IconStar;
                return (
                  <Tooltip key={badge.id} label={badge.description} withArrow>
                    <Paper className="card-stat" p="md" ta="center">
                      <ThemeIcon size={48} radius="xl" color={badge.color || 'violet'}>
                        <IconComponent size={24} />
                      </ThemeIcon>
                      <Text size="sm" fw={500} mt="xs">{badge.name}</Text>
                    </Paper>
                  </Tooltip>
                );
              })}
            </SimpleGrid>
          </>
        )}

        <Divider my="xl" />
        <Group>
          <Button
            leftSection={<IconFileExport size={16} />}
            onClick={() => window.open('/api/profile/export', '_blank')}
            variant="outline"
            color="violet"
          >
            Exportar mis datos (CSV)
          </Button>
        </Group>

        <Divider my="xl" />
        <Title order={3} mb="md">
          <IconPalette size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Selecciona tu Banner
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {banners.map((banner) => (
            <Card
              key={banner.id}
              className="card-stat"
              padding="lg"
              style={{
                cursor: 'pointer',
                borderColor: user?.banner_id === banner.id ? '#7C3AED' : 'var(--border-color)',
              }}
              onClick={() => handleSelectBanner(banner.id)}
            >
              <CardSection>
                <img
                  src={banner.image_url}
                  alt={banner.name}
                  style={{
                    width: '100%',
                    height: 150,
                    objectFit: 'cover',
                    borderRadius: '8px 8px 0 0',
                  }}
                />
              </CardSection>
              <Text ta="center" mt="md" fw={500}>{banner.name}</Text>
              <Text ta="center" size="sm" c="dimmed">{banner.points_cost} pts</Text>
            </Card>
          ))}
        </SimpleGrid>
      </Paper>
    </Container>
  );
};

export default Profile;
