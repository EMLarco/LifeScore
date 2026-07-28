import { Box, Overlay, Center, Stack, Text, Button } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

export const PremiumLock = ({ children, isPremium, title = 'Contenido Premium' }) => {
  if (isPremium) return children;

  return (
    <Box style={{ position: 'relative', height: '100%', minHeight: 300, width: '100%' }}>
      <div style={{ filter: 'blur(6px)', opacity: 0.4, pointerEvents: 'none' }}>
        {children}
      </div>
      <Overlay color="var(--bg-paper)" opacity={0.7} blur={2} />
      <Center style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Stack align="center" gap="md">
          <IconLock size={60} color="#7C3AED" />
          <Text size="xl" fw={700} ta="center" style={{ color: 'var(--text-primary)' }}>
            {title}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Desbloquea esta funcion con la membresia Premium
          </Text>
          <Button
            variant="gradient"
            gradient={{ from: '#7C3AED', to: '#EC4899' }}
            radius="xl"
          >
            Mejorar a Premium
          </Button>
        </Stack>
      </Center>
    </Box>
  );
};
