'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

// Routes that should show the full-page layout (no sidebar)
const fullPageRoutes = ['/', '/login'];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // Check if this is a full-page route (no sidebar)
  const isFullPageRoute = fullPageRoutes.includes(pathname);

  if (isFullPageRoute) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0a0a0f] bg-gradient-radial pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
