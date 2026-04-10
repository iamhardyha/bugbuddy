'use client';

import React from 'react';
import { Card, Spin } from 'antd';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading?: boolean;
  color?: string;
}

const DEFAULT_COLOR = '#5548e0';

export default function StatCard({ title, value, icon, loading, color = DEFAULT_COLOR }: StatCardProps) {
  return (
    <Card className={styles.card} hoverable>
      <div className={styles.inner}>
        <div
          className={styles.iconBox}
          style={{ background: `${color}14`, color }}
        >
          {icon}
        </div>
        <div className={styles.info}>
          <span className={styles.label}>{title}</span>
          {loading ? (
            <Spin size="small" />
          ) : (
            <span className={styles.value}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
