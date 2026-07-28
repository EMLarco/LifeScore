import { Center, Loader, Stack, Title } from '@mantine/core';

export const LoadingScreen = () => {
  return (
    <Center style={{ height: '100vh' }}>
      <Stack align="center">
        <Loader size="xl" color="violet" />
        <Title order={3} c="dimmed">
          Cargando LifeScore...
        </Title>
      </Stack>
    </Center>
  );
};