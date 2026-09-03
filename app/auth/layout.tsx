import React from 'react';

// ---- CORE IMPORTS ---- //
import {findTheme} from '@/orm/theme';

// ---- LOCAL IMPORTS ---- //
import Theme from '@/app/theme';

/* Auth pages live outside the [tenant] segment, so they are not covered by the
 * tenant layout's Theme. They share the deployment's default theme (findTheme
 * is tenant-agnostic), so a layout is enough here. Per-tenant browser variables
 * (Environment) still need the ?tenant= param, so each auth page that consumes
 * them sets up its own Environment. */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await findTheme();

  return <Theme theme={theme}>{children}</Theme>;
}
