import { NavLink } from 'react-router-dom';
import { Stack, Text, Box, ThemeIcon, Group, Divider } from '@mantine/core';
import {
  IconHome, IconList, IconTarget, IconTrophy, IconShoppingCart,
  IconCalendarTime, IconBrain, IconShieldLock, IconUsers, IconPalette,
  IconCrown, IconMedal, IconCoin, IconReceipt, IconUser, IconSettings, IconCash,
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';

const buildSections = (user) => {
  const principal = {
    label: 'Principal',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: IconHome },
      { to: '/habits', label: 'Mis Habitos', icon: IconList },
      { to: '/challenges', label: 'Retos', icon: IconTarget },
      { to: '/achievements', label: 'Logros', icon: IconTrophy },
    ],
  };

  const tienda = {
    label: 'Tienda',
    items: [
      { to: '/store', label: 'Tienda', icon: IconShoppingCart },
      { to: '/points-store', label: 'Comprar Puntos', icon: IconCoin },
      { to: '/withdrawals', label: 'Retirar Puntos', icon: IconCash },
      { to: '/skins', label: 'Skins', icon: IconPalette },
    ],
  };
  if (!user?.is_premium) {
    tienda.items.push({ to: '/premium', label: 'Premium', icon: IconCrown });
  }

  const social = {
    label: 'Social',
    items: [
      { to: '/friends', label: 'Amigos', icon: IconUsers },
      { to: '/ranking', label: 'Ranking', icon: IconTrophy },
    ],
  };
  if (user?.is_premium) {
    social.items.push({ to: '/premium-challenges', label: 'Retos Premium', icon: IconMedal });
  }

  const personal = {
    label: 'Personal',
    items: [
      { to: '/schedule', label: 'Horario', icon: IconCalendarTime },
    ],
  };
  if (user?.is_premium) {
    personal.items.push({ to: '/agent', label: 'Agente IA', icon: IconBrain });
  }
  personal.items.push(
    { to: '/invoices', label: 'Facturas', icon: IconReceipt },
    { to: '/profile', label: 'Perfil', icon: IconUser },
    { to: '/settings', label: 'Configuracion', icon: IconSettings },
  );

  const sections = [principal, tienda, social, personal];

  if (user?.is_admin) {
    sections.push({
      label: 'Administracion',
      items: [{ to: '/admin', label: 'Panel Admin', icon: IconShieldLock }],
    });
  }

  return sections;
};

export const Sidebar = () => {
  const { user } = useAuth();
  const sections = buildSections(user);

  return (
    <Box
      p="md"
      style={{
        height: '100%',
        background: 'var(--bg-paper)',
        borderRight: '1px solid var(--border-color)',
        overflowY: 'auto',
      }}
    >
      <Stack gap="lg">
        {sections.map((section, idx) => (
          <Box key={idx}>
            <Group gap="xs" mb="xs">
              <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                {section.label}
              </Text>
            </Group>

            <Stack gap={2}>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'var(--mantine-color-violet-filled)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <ThemeIcon
                        variant={isActive ? 'filled' : 'subtle'}
                        color="violet"
                        size="sm"
                        mr="md"
                      >
                        <item.icon size={18} />
                      </ThemeIcon>
                      <Text size="sm" fw={isActive ? 500 : 400}>
                        {item.label}
                      </Text>
                    </>
                  )}
                </NavLink>
              ))}
            </Stack>
            {idx < sections.length - 1 && <Divider my="sm" variant="dashed" />}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
