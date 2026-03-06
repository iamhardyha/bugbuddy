import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { AntdProvider } from '@/components/common/AntdProvider';
import { ModalProvider } from '@/components/common/ModalProvider';
import GlobalHeader from '@/components/common/GlobalHeader';
import './globals.css';

export const metadata: Metadata = {
  title: '버그버디',
  description: '1:1 개발자 멘토링 커뮤니티',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <AntdRegistry>
          <ThemeProvider>
            <AntdProvider>
              <ModalProvider>
                <GlobalHeader />
                {children}
              </ModalProvider>
            </AntdProvider>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
