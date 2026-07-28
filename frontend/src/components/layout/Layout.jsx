import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: { sm: 250 },
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <Navbar opened={opened} toggle={toggle} />
      <AppShell.Navbar p="md" style={{ background: 'var(--bg-paper)', borderRight: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main style={{ background: 'var(--bg-main)' }}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};