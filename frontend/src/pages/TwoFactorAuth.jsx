import { useState } from 'react';
import { Container, Paper, Title, Text, TextInput, Button, Stack, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginWith2FA, send2FACode } from '../services/authService';
import { IconShield } from '@tabler/icons-react';

const TwoFactorAuth = () => {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const tempToken = sessionStorage.getItem('temp_2fa_token');
  const userEmail = sessionStorage.getItem('temp_2fa_email');

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      notifications.show({ title: 'Error', message: 'Ingresa un codigo de 6 digitos', color: 'red' });
      return;
    }
    if (!tempToken) {
      notifications.show({ title: 'Error', message: 'Sesion expirada. Inicia sesion de nuevo.', color: 'red' });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const data = await loginWith2FA(tempToken, code);
      if (data.success) {
        sessionStorage.removeItem('temp_2fa_token');
        sessionStorage.removeItem('temp_2fa_email');
        setAuth(data.user, data.token);
        notifications.show({ title: 'Verificacion exitosa', message: `Bienvenido ${data.user.name}`, color: 'green' });
        navigate('/dashboard');
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Codigo invalido',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userEmail) return;
    setResending(true);
    try {
      await send2FACode(userEmail);
      notifications.show({ title: 'Codigo reenviado', message: 'Revisa tu correo', color: 'green' });
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudo reenviar el codigo', color: 'red' });
    } finally {
      setResending(false);
    }
  };

  return (
    <Center style={{ height: '100vh' }}>
      <Container size="xs">
        <Paper className="paper-clean" p="xl">
          <Center mb="md">
            <IconShield size={40} color="#7C3AED" />
          </Center>
          <Title order={2} ta="center" mb="sm">Verificacion en dos pasos</Title>
          <Text size="sm" c="dimmed" ta="center" mb="lg">
            Hemos enviado un codigo de 6 digitos a tu correo electronico.
          </Text>
          <Stack>
            <TextInput
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              size="lg"
              styles={{ input: { textAlign: 'center', fontSize: 24, letterSpacing: 8 } }}
            />
            <Button onClick={handleVerify} loading={loading} fullWidth size="lg" color="violet">
              Verificar
            </Button>
            <Button variant="subtle" size="xs" onClick={handleResend} loading={resending} fullWidth>
              Reenviar codigo
            </Button>
            <Button variant="subtle" size="xs" onClick={() => navigate('/login')} fullWidth>
              Volver al login
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
};

export default TwoFactorAuth;
