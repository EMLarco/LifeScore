import { Alert, Text, Button } from '@mantine/core';
import { IconAlertCircle, IconReload } from '@tabler/icons-react';

export const ErrorMessage = ({
  title = 'Algo salió mal',
  message = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
  onRetry,
  retryText = 'Reintentar',
}) => {
  return (
    <Alert
      icon={<IconAlertCircle size={24} />}
      title={title}
      color="red"
      radius="md"
      variant="filled"
      p="lg"
    >
      <Text size="sm" mb="md">
        {message}
      </Text>
      {onRetry && (
        <Button
          size="xs"
          color="red"
          variant="outline"
          leftSection={<IconReload size={16} />}
          onClick={onRetry}
        >
          {retryText}
        </Button>
      )}
    </Alert>
  );
};