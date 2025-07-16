"use client";

import { AppShell, Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

interface AuthenticatedAppLayoutInterface {
  children: React.ReactNode;
}
const AuthenticatedAppLayout: React.FC<AuthenticatedAppLayoutInterface> = ({
  children,
}) => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 200,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <div>Logo</div>
      </AppShell.Header>

      <AppShell.Navbar p="md">Navbar</AppShell.Navbar>

      <AppShell.Main>
        <div>{children}</div>
      </AppShell.Main>
    </AppShell>
  );
};

export default AuthenticatedAppLayout;
