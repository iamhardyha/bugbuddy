import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export const metadata = { title: 'BugBuddy Admin' };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      {children}
    </AdminAuthGuard>
  );
}
