import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  Button,
  Group,
  Badge,
  Card,
  Divider,
  SimpleGrid,
  Loader,
  Alert,
} from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import {
  IconCrown,
  IconBrandPaypal,
  IconCheck,
  IconCalendar,
  IconReceipt,
  IconDownload,
  IconAlertCircle,
} from '@tabler/icons-react';
import {
  createOrder,
  getSubscriptionStatus,
  getInvoices,
  generateInvoice,
} from '../services/paymentService';

const PLANS = [
  {
    id: 'monthly',
    name: 'Mensual',
    price: 9.99,
    period: '/mes',
    features: ['Retos premium exclusivos', 'Skins exclusivas', 'Agente IA avanzado', 'Badges premium', 'Soporte prioritario'],
  },
  {
    id: 'yearly',
    name: 'Anual',
    price: 89.99,
    period: '/ano',
    badge: 'Ahorra 25%',
    features: ['Todo lo del plan mensual', '2 meses gratis', 'Acceso anticipado a nuevas funciones', 'Insignia de fundador'],
  },
];

const PremiumSubscription = () => {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const cancelled = searchParams.get('canceled');
  const success = searchParams.get('success');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (cancelled === 'true') {
      notifications.show({
        title: 'Pago cancelado',
        message: 'El pago fue cancelado',
        color: 'yellow',
      });
      setSearchParams({});
    } else if (success === 'true') {
      loadData();
      setSearchParams({});
    }
  }, [cancelled, success]);

  const loadData = async () => {
    try {
      const [sub, inv] = await Promise.all([
        getSubscriptionStatus().catch(() => null),
        getInvoices().catch(() => []),
      ]);
      setSubscription(sub);
      setInvoices(inv || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setPaying(true);
    try {
      const data = await createOrder(planId);
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo crear la orden de pago',
        color: 'red',
      });
      setPaying(false);
    }
  };

  const handleGenerateInvoice = async (paymentId) => {
    try {
      const data = await generateInvoice(paymentId);
      window.open(data.downloadUrl, '_blank');
      loadData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo generar la factura',
        color: 'red',
      });
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl" style={{ textAlign: 'center', paddingTop: 100 }}>
        <Loader size="lg" color="violet" />
      </Container>
    );
  }

  const isActive = user?.is_premium || subscription?.status === 'active';

  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" radius="lg" p="xl">
        <Group justify="space-between" mb="lg">
          <Title order={1}>
            <IconCrown size={32} color="#7C3AED" style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Membresia Premium
          </Title>
          {isActive && (
            <Badge color="gold" variant="filled" size="lg" leftSection={<IconCrown size={16} />}>
              Activo
            </Badge>
          )}
        </Group>

        {isActive ? (
          <Stack gap="md">
            {subscription && (
              <Card withBorder style={{ background: 'var(--bg-card)' }}>
                <Group justify="space-between">
                  <div>
                    <Text fw={600} size="lg">{subscription.plan_name || 'LifeScore Premium'}</Text>
                    <Text c="dimmed" size="sm">
                      <IconCalendar size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      Activo desde {new Date(subscription.started_at || subscription.created_at).toLocaleDateString('es-ES')}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text fw={700} size="xl" c="violet">${Number(subscription.amount || 9.99).toFixed(2)}</Text>
                    <Text c="dimmed" size="sm">{subscription.plan_id === 'yearly' ? '/ano' : '/mes'}</Text>
                  </div>
                </Group>
              </Card>
            )}

            <Alert color="green" icon={<IconCheck size={16} />}>
              Tu membresia Premium esta activa. Disfruta de todos los beneficios exclusivos.
            </Alert>

            {invoices.length > 0 && (
              <>
                <Divider label="Facturas" labelPosition="left" my="md" />
                <Stack gap="sm">
                  {invoices.map((inv) => (
                    <Card key={inv.id} withBorder style={{ background: 'var(--bg-card)' }} p="sm">
                      <Group justify="space-between">
                        <div>
                          <Text fw={500} size="sm">
                            <IconReceipt size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {inv.invoice_number}
                          </Text>
                          <Text c="dimmed" size="xs">{new Date(inv.created_at).toLocaleDateString('es-ES')} - {inv.description}</Text>
                        </div>
                        <Group>
                          <Text fw={600}>${Number(inv.amount).toFixed(2)}</Text>
                          <Button
                            size="xs"
                            variant="light"
                            color="violet"
                            leftSection={<IconDownload size={14} />}
                            onClick={() => window.open(`/api/invoices/${inv.invoice_number}/download`, '_blank')}
                          >
                            PDF
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mt="md">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                withBorder
                p="xl"
                style={{
                  background: 'var(--bg-card)',
                  border: plan.badge ? '2px solid var(--mantine-color-violet-6)' : undefined,
                  position: 'relative',
                }}
              >
                {plan.badge && (
                  <Badge
                    color="violet"
                    variant="filled"
                    size="lg"
                    style={{ position: 'absolute', top: -10, right: 16 }}
                  >
                    {plan.badge}
                  </Badge>
                )}
                <Stack gap="md">
                  <div>
                    <Text fw={700} size="xl">{plan.name}</Text>
                    <Group align="baseline" gap={4} mt="xs">
                      <Text fw={800} size="3xl" c="violet">${plan.price}</Text>
                      <Text c="dimmed" size="sm">{plan.period}</Text>
                    </Group>
                  </div>

                  <Divider />

                  <Stack gap="xs">
                    {plan.features.map((feature) => (
                      <Group key={feature} gap="xs">
                        <IconCheck size={16} color="#2ECC71" />
                        <Text size="sm">{feature}</Text>
                      </Group>
                    ))}
                  </Stack>

                  <Button
                    variant="gradient"
                    gradient={{ from: '#7C3AED', to: '#EC4899' }}
                    size="lg"
                    leftSection={<IconBrandPaypal size={20} />}
                    onClick={() => handleSubscribe(plan.id)}
                    loading={paying}
                    fullWidth
                  >
                    Pagar con PayPal
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Paper>
    </Container>
  );
};

export default PremiumSubscription;
