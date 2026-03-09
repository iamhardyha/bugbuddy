import type { Metadata } from 'next';
import { Syne, Outfit, JetBrains_Mono } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { AntdProvider } from '@/components/common/AntdProvider';
import { ModalProvider } from '@/components/common/ModalProvider';
import GlobalHeader from '@/components/common/GlobalHeader';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Logos',
  description: '개발자를 위한 1:1 멘토링 커뮤니티',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${syne.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
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
