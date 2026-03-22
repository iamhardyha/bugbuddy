'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAdminLoggedIn } from '@/lib/adminAuth';
import { Spin } from 'antd';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/admin/login') {
      setChecking(false);
      return;
    }
    if (!isAdminLoggedIn()) {
      router.replace('/admin/login');
    } else {
      setChecking(false);
    }
  }, [pathname, router]);

  if (checking && pathname !== '/admin/login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}
