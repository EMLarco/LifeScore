import { MantineProvider, ColorSchemeScript, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';
import Rewards from './pages/Rewards';
import Store from './pages/Store';
import PremiumFeatures from './pages/PremiumFeatures';
import PremiumSubscription from './pages/PremiumSubscription';
import PremiumChallenges from './pages/PremiumChallenges';
import Settings from './pages/Settings';
import Schedule from './pages/Schedule';
import Agent from './pages/Agent';
import AdminPanel from './pages/AdminPanel';
import Challenges from './pages/Challenges';
import Friends from './pages/Friends';
import GoogleCallback from './pages/GoogleCallback';
import TwoFactorAuth from './pages/TwoFactorAuth';
import PaymentSuccess from './pages/PaymentSuccess';
import Landing from './pages/Landing';
import Ranking from './pages/Ranking';
import Skins from './pages/Skins';
import Sessions from './pages/Sessions';
import PointsStore from './pages/PointsStore';
import PointsSuccess from './pages/PointsSuccess';
import Invoices from './pages/Invoices';
import Withdrawals from './pages/Withdrawals';
import { Layout } from './components/layout/Layout';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

const theme = createTheme({
  primaryColor: 'violet',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, sans-serif',
  colors: {
    violet: [
      '#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC',
      '#A855F7', '#8B5CF6', '#7C3AED', '#6D28D9',
      '#5B21B6', '#4C1D95',
    ],
  },
  components: {
    Paper: {
      defaultProps: {
        radius: 'lg',
        p: 'xl',
      },
      styles: {
        root: {
          backgroundColor: 'var(--bg-paper)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow)',
        },
      },
    },
    Card: {
      styles: {
        root: {
          backgroundColor: 'var(--bg-card)',
        },
      },
    },
    Title: {
      styles: {
        root: {
          color: 'var(--text-primary)',
        },
      },
    },
    Text: {
      styles: {
        root: {
          color: 'var(--text-secondary)',
        },
      },
    },
    Badge: {
      styles: {
        root: {
          color: 'var(--text-primary)',
        },
      },
    },
    Button: {
      defaultProps: {
        radius: 'xl',
      },
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: 'var(--text-primary)', textAlign: 'center', marginTop: 50 }}>Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ColorSchemeScript />
      <Notifications position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/google-callback" element={<GoogleCallback />} />
            <Route path="/2fa" element={<TwoFactorAuth />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/points-success" element={<PointsSuccess />} />
            <Route path="/payment-cancel" element={<Navigate to="/premium?canceled=true" />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/store" element={<Store />} />
              <Route path="/premium" element={<PremiumSubscription />} />
              <Route path="/premium/classic" element={<PremiumFeatures />} />
              <Route path="/premium-challenges" element={<PremiumChallenges />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/skins" element={<Skins />} />
              <Route path="/points-store" element={<PointsStore />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/withdrawals" element={<Withdrawals />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/agent" element={<Agent />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
