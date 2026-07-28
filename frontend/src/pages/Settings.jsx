import { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  TextInput,
  PasswordInput,
  Button,
  Switch,
  Select,
  Divider,
  Box,
  Badge,
  Modal,
} from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import api from '../api/axiosConfig';
import {
  IconUser,
  IconMail,
  IconLock,
  IconShield,
  IconBell,
  IconMoon,
  IconSun,
  IconTag,
  IconHistory,
  IconBrandSlack,
} from '@tabler/icons-react';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qrModalOpened, setQrModalOpened] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [disableModalOpened, setDisableModalOpened] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    gender: user?.gender || 'other',
    username: user?.username || '',
    tag: user?.tag || '',
    slack_webhook: user?.slack_webhook || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const res = await api.put('/profile', { name: profileForm.name, email: profileForm.email, gender: profileForm.gender });
      updateUser(res.data.user);
      notifications.show({ title: 'Perfil actualizado', message: 'Tus datos se han actualizado correctamente', color: 'green' });
    } catch (error) {
      notifications.show({ title: 'Error', message: error.response?.data?.message || 'No se pudo actualizar', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsernameTag = async () => {
    setLoading(true);
    try {
      await api.put('/profile/username-tag', { username: profileForm.username, tag: profileForm.tag });
      updateUser({ ...user, username: profileForm.username, tag: profileForm.tag });
      notifications.show({ title: 'Identidad actualizada', message: 'Nombre de usuario y tag actualizados', color: 'green' });
    } catch (error) {
      notifications.show({ title: 'Error', message: error.response?.data?.message || 'No se pudo actualizar', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notifications.show({ title: 'Error', message: 'Las contrasenas no coinciden', color: 'red' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      notifications.show({ title: 'Error', message: 'Minimo 6 caracteres', color: 'red' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      notifications.show({ title: 'Contrasena actualizada', message: 'Tu contrasena se ha cambiado', color: 'green' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      notifications.show({ title: 'Error', message: error.response?.data?.message || 'Error', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const res = await api.get('/2fa/setup');
      if (res.data.success) {
        setQrCode(res.data.data.qrCode);
        setQrModalOpened(true);
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: error.response?.data?.message || 'No se pudo configurar 2FA', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      notifications.show({ title: 'Error', message: 'Ingresa un codigo de 6 digitos', color: 'red' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/2fa/verify', { token: verifyCode });
      updateUser({ ...user, totp_enabled: true });
      setQrModalOpened(false);
      setVerifyCode('');
      notifications.show({ title: '2FA activado', message: 'Tu cuenta ahora esta protegida con 2FA', color: 'green' });
    } catch (error) {
      notifications.show({ title: 'Error', message: error.response?.data?.message || 'Codigo invalido', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disableCode || disableCode.length !== 6) {
      notifications.show({ title: 'Error', message: 'Ingresa un codigo de 6 digitos', color: 'red' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/2fa/disable', { code: disableCode });
      updateUser({ ...user, totp_enabled: false });
      setDisableModalOpened(false);
      setDisableCode('');
      notifications.show({ title: '2FA desactivado', message: 'La verificacion en dos pasos ha sido desactivada', color: 'yellow' });
    } catch (error) {
      notifications.show({ title: 'Error', message: error.response?.data?.message || 'Codigo invalido', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" radius="lg" p="xl">
        <Title order={1} mb="lg">Configuracion</Title>

        <Title order={3} mt="xl" mb="sm">Informacion Personal</Title>
        <Text size="sm" c="dimmed" mb="md">Actualiza tus datos personales</Text>
        <Box>
          <TextInput label="Nombre completo" placeholder="Tu nombre" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} leftSection={<IconUser size={16} />} mb="md" />
          <TextInput label="Email" placeholder="tu@email.com" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} leftSection={<IconMail size={16} />} mb="md" />
          <Select label="Genero" placeholder="Selecciona" data={[{ value: 'male', label: 'Masculino' }, { value: 'female', label: 'Femenino' }, { value: 'other', label: 'Otro' }]} value={profileForm.gender} onChange={(value) => setProfileForm({ ...profileForm, gender: value })} mb="md" />
          <Button onClick={handleUpdateProfile} loading={loading}>Guardar cambios</Button>
        </Box>

        <Divider my="xl" />

        <Title order={3} mt="xl" mb="sm">Identidad de usuario</Title>
        <Text size="sm" c="dimmed" mb="md">Elige un nombre de usuario unico y un tag de 5 caracteres</Text>
        <Box>
          <TextInput
            label="Nombre de usuario"
            placeholder="Ej. juanito"
            value={profileForm.username}
            onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
            leftSection={<IconUser size={16} />}
            mb="md"
          />
          <TextInput
            label="Tag (5 caracteres)"
            placeholder="Ej. ABC12"
            maxLength={5}
            value={profileForm.tag}
            onChange={(e) => setProfileForm({ ...profileForm, tag: e.target.value.toUpperCase() })}
            leftSection={<IconTag size={16} />}
            mb="md"
          />
          <Button onClick={handleUpdateUsernameTag} loading={loading} color="violet">Actualizar identidad</Button>
        </Box>

        <Divider my="xl" />

        <Title order={3} mt="xl" mb="sm">Cambiar Contrasena</Title>
        <Text size="sm" c="dimmed" mb="md">Actualiza tu contrasena de acceso</Text>
        <Box>
          <PasswordInput label="Contrasena actual" placeholder="Tu contrasena actual" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} leftSection={<IconLock size={16} />} mb="md" />
          <PasswordInput label="Nueva contrasena" placeholder="Minimo 6 caracteres" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} leftSection={<IconLock size={16} />} mb="md" />
          <PasswordInput label="Confirmar nueva contrasena" placeholder="Repite la nueva contrasena" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} leftSection={<IconLock size={16} />} mb="md" />
          <Button onClick={handleChangePassword} loading={loading} color="orange">Cambiar contrasena</Button>
        </Box>

        <Divider my="xl" />

        <Title order={3} mt="xl" mb="sm">Seguridad</Title>
        <Text size="sm" c="dimmed" mb="md">Verificacion en dos pasos (2FA)</Text>
        <Group>
          {user?.totp_enabled ? (
            <Button color="red" variant="outline" leftSection={<IconShield size={16} />} onClick={() => setDisableModalOpened(true)}>
              Desactivar 2FA
            </Button>
          ) : (
            <Button color="violet" variant="outline" leftSection={<IconShield size={16} />} onClick={handleEnable2FA} loading={loading}>
              Activar 2FA
            </Button>
          )}
          {user?.totp_enabled && (
            <Badge color="green" leftSection={<IconShield size={14} />}>Activado</Badge>
          )}
        </Group>

        <Divider my="xl" />

        <Title order={3} mt="xl" mb="sm">Notificaciones</Title>
        <Text size="sm" c="dimmed" mb="md">Gestiona como recibes alertas</Text>
        <Stack>
          <Switch label="Notificaciones push" description="Recibe notificaciones en tu dispositivo" checked={pushEnabled} onChange={() => setPushEnabled(!pushEnabled)} color="violet" />
          <Switch label="Notificaciones por email" description="Recibe correos electronicos con resumenes" checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} color="violet" />
        </Stack>

        <Divider my="xl" />

        <Title order={3} mt="xl" mb="sm">Apariencia</Title>
        <Text size="sm" c="dimmed" mb="md">Personaliza el aspecto de la aplicacion</Text>
        <Group>
          <Button variant="subtle" color="violet" leftSection={<IconMoon size={16} />} onClick={() => { document.documentElement.setAttribute('data-mantine-color-scheme', 'dark'); localStorage.setItem('mantine-color-scheme', 'dark'); }}>Oscuro</Button>
          <Button variant="subtle" color="violet" leftSection={<IconSun size={16} />} onClick={() => { document.documentElement.setAttribute('data-mantine-color-scheme', 'light'); localStorage.setItem('mantine-color-scheme', 'light'); }}>Claro</Button>
        </Group>

        <Divider my="xl" />
        <Text size="xs" c="dimmed" ta="center" mt="xl">Version 1.0.0</Text>
      </Paper>

      <Modal opened={qrModalOpened} onClose={() => setQrModalOpened(false)} title="Configurar 2FA" centered size="sm">
        <Stack align="center" gap="md">
          <Text size="sm" c="dimmed" ta="center">Escanea este codigo QR con tu app autenticadora (Google Authenticator, Authy, etc.)</Text>
          {qrCode && (
            <Paper p="md" style={{ background: 'white', borderRadius: 12, display: 'flex', justifyContent: 'center' }}>
              <img src={qrCode} alt="QR Code 2FA" width={200} height={200} style={{ display: 'block' }} />
            </Paper>
          )}
          <Text size="xs" c="dimmed" ta="center">O ingresa manualmente el codigo en tu app</Text>
          <TextInput placeholder="Codigo de 6 digitos" maxLength={6} value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} size="lg" styles={{ input: { textAlign: 'center', fontSize: 24, letterSpacing: 8 } }} />
          <Button onClick={handleVerify2FA} loading={loading} fullWidth color="violet">Verificar y Activar</Button>
        </Stack>
      </Modal>

      <Modal opened={disableModalOpened} onClose={() => setDisableModalOpened(false)} title="Desactivar 2FA" centered>
        <Stack align="center" gap="md">
          <Text size="sm" c="dimmed" ta="center">Ingresa un codigo valido de tu app autenticadora para desactivar 2FA</Text>
          <TextInput placeholder="Codigo de 6 digitos" maxLength={6} value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))} size="lg" styles={{ input: { textAlign: 'center', fontSize: 24, letterSpacing: 8 } }} />
          <Button onClick={handleDisable2FA} loading={loading} fullWidth color="red">Desactivar 2FA</Button>
        </Stack>
      </Modal>

      <Divider my="xl" />

      <Title order={3} mt="xl" mb="sm">
        <IconBrandSlack size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        Integracion Slack
      </Title>
      <Text size="sm" c="dimmed" mb="md">Recibe notificaciones en Slack cuando completes habitos</Text>
      <TextInput
        label="Slack Webhook URL"
        placeholder="https://hooks.slack.com/services/..."
        value={profileForm.slack_webhook || ''}
        onChange={(e) => setProfileForm({ ...profileForm, slack_webhook: e.target.value })}
        leftSection={<IconBrandSlack size={16} />}
        mb="md"
      />
      <Button onClick={async () => {
        setLoading(true);
        try {
          await api.put('/profile/slack-webhook', { slack_webhook: profileForm.slack_webhook });
          notifications.show({ color: 'green', message: 'Webhook actualizado' });
        } catch {
          notifications.show({ color: 'red', message: 'Error al guardar webhook' });
        } finally {
          setLoading(false);
        }
      }} loading={loading} color="violet">Guardar webhook</Button>

      <Divider my="xl" />

      <Title order={3} mt="xl" mb="sm">Sesiones Activas</Title>
      <Text size="sm" c="dimmed" mb="md">Gestiona los dispositivos conectados a tu cuenta</Text>
      <Button
        component="a"
        href="/sessions"
        variant="light"
        color="violet"
        leftSection={<IconHistory size={16} />}
      >
        Ver historial de sesiones
      </Button>
    </Container>
  );
};

export default Settings;
