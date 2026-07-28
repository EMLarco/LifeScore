import { useState } from 'react';
import {
  Button,
  Popover,
  Stack,
  Text,
  Box,
  Badge,
  Group,
  Divider,
} from '@mantine/core';
import { IconCalendar, IconCoin, IconCheck } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import dayjs from 'dayjs';

const streakRewards = [
  { day: 1, points: 5 },
  { day: 2, points: 7 },
  { day: 3, points: 10 },
  { day: 4, points: 12 },
  { day: 5, points: 15 },
  { day: 6, points: 18 },
  { day: 7, points: 25 },
];

const DailyLoginButton = () => {
  const { user } = useAuth();
  const [opened, setOpened] = useState(false);

  const today = dayjs().format('YYYY-MM-DD');
  const lastLogin = user?.last_login ? dayjs(user.last_login).format('YYYY-MM-DD') : null;
  const isLoggedInToday = lastLogin === today;
  const streak = user?.daily_streak || 0;

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      width={300}
      position="bottom"
      shadow="xl"
    >
      <Popover.Target>
        <Button
          variant={isLoggedInToday ? 'subtle' : 'filled'}
          color={isLoggedInToday ? 'green' : 'violet'}
          leftSection={<IconCalendar size={18} />}
          onClick={() => setOpened((o) => !o)}
        >
          {isLoggedInToday ? 'Login Diario' : 'Login Diario'}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={700}>Recompensas por Racha</Text>
            <Badge color="gold" leftSection={<IconCoin size={14} />}>
              {streak} dias
            </Badge>
          </Group>
          <Divider />
          <Box style={{ maxHeight: 200, overflowY: 'auto' }}>
            {streakRewards.map((reward) => (
              <Group key={reward.day} justify="space-between" py="xs">
                <Text size="sm">
                  Dia {reward.day}
                  {reward.day <= streak && <IconCheck size={14} color="#2ECC71" style={{ marginLeft: 8 }} />}
                </Text>
                <Badge color={reward.day <= streak ? 'green' : 'gray'} leftSection={<IconCoin size={12} />}>
                  +{reward.points} pts
                </Badge>
              </Group>
            ))}
          </Box>
          <Divider />
          <Text size="xs" c="dimmed">
            Inicia sesion cada dia para acumular puntos extra. No rompas tu racha!
          </Text>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

export default DailyLoginButton;
