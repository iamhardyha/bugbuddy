import { ConfigProvider, theme as antTheme } from 'antd';
import { useTheme } from './ThemeProvider';
import type { ReactNode } from 'react';

export function AntdProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <ConfigProvider
      theme={{
        cssVar: {},
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary:         isDark ? '#7c65f6' : '#5548e0',
          colorError:           isDark ? '#f87171' : '#c0392b',
          colorSuccess:         isDark ? '#34c784' : '#1a9c5e',
          colorWarning:         isDark ? '#fbbf24' : '#e07020',
          colorBgContainer:     isDark ? '#13131e' : '#ffffff',
          colorBgLayout:        isDark ? '#0d0d14' : '#f2f2f7',
          colorBgElevated:      isDark ? '#1b1b2a' : '#ffffff',
          colorBorder:          isDark ? '#262638' : '#d6d6e8',
          colorBorderSecondary: isDark ? '#1c1c2e' : '#e8e8f2',
          colorText:            isDark ? '#e6e6f2' : '#0c0c1e',
          colorTextSecondary:   isDark ? '#8686a8' : '#4a4a6a',
          colorTextTertiary:    isDark ? '#505068' : '#8888aa',
          borderRadius:         8,
          fontFamily:           "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
          fontSize:             14,
          controlHeight:        38,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
