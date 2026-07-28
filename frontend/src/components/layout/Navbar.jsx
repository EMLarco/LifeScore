import { useNavigate } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  Avatar,
  Menu,
  Text,
  Divider,
  useMantineColorScheme,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { IconSun, IconMoon, IconLogout, IconUser, IconTrophy, IconList, IconCoin, IconCrown, IconShoppingCart, IconSettings } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import DailyLoginButton from '../common/DailyLoginButton';

export const Navbar = ({ opened, toggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          {/* LOGO */}
          <img
            src="/icon-192x192.png"
            alt="LifeScore"
            style={{ height: 72, width: 'auto', borderRadius: 14, cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          />
        </Group>

        <Group>
          {/* Boton de Login Diario */}
          <DailyLoginButton />

          {/* Mostrar puntos del usuario */}
          {user && (
            <Badge color="gold" variant="filled" size="lg" leftSection={<IconCoin size={16} />}>
              {user.points || 0} pts
            </Badge>
          )}

          <ActionIcon
            variant="subtle"
            color={colorScheme === 'dark' ? 'yellow' : 'blue'}
            onClick={() => toggleColorScheme()}
            size="lg"
          >
            {colorScheme === 'dark' ? <IconSun size={22} /> : <IconMoon size={22} />}
          </ActionIcon>

          <Menu shadow="md" width={220} position="bottom-end">
            <Menu.Target>
              <Avatar
                src={null}
                alt={user?.name}
                color="violet"
                radius="xl"
                style={{ cursor: 'pointer' }}
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>
                <Text size="sm" fw={700}>
                  {user?.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {user?.email}
                </Text>
                {user?.is_premium && (
                  <Badge color="gold" variant="light" size="xs" mt="4" leftSection={<IconCrown size={10} />}>
                    Premium
                  </Badge>
                )}
              </Menu.Label>

              <Divider />

              <Menu.Item leftSection={<IconUser size={18} />} onClick={() => navigate('/profile')}>
                Mi Perfil
              </Menu.Item>
              <Menu.Item leftSection={<IconList size={18} />} onClick={() => navigate('/habits')}>
                Mis Hábitos
              </Menu.Item>
              <Menu.Item leftSection={<IconTrophy size={18} />} onClick={() => navigate('/achievements')}>
                Logros
              </Menu.Item>
              <Menu.Item leftSection={<IconShoppingCart size={18} />} onClick={() => navigate('/store')}>
                Tienda
              </Menu.Item>
              <Menu.Item leftSection={<IconCrown size={18} />} onClick={() => navigate('/premium')}>
                Premium
              </Menu.Item>
              <Menu.Item leftSection={<IconSettings size={18} />} onClick={() => navigate('/settings')}>
                Configuracion
              </Menu.Item>

              <Divider />

              <Menu.Item leftSection={<IconLogout size={18} />} color="red" onClick={handleLogout}>
                Cerrar Sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </AppShell.Header>
  );
};