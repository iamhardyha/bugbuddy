'use client';

import React from 'react';
import { Empty, Spin } from 'antd';
import dynamic from 'next/dynamic';
import styles from './TrendChart.module.css';

const Line = dynamic(
  () => import('@ant-design/charts').then((mod) => mod.Line),
  { ssr: false },
);

interface TrendChartProps {
  data: { date: string; count: number }[];
  loading?: boolean;
}

export default function TrendChart({ data, loading }: TrendChartProps) {
  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <Empty description="데이터 없음" />;
  }

  const config = {
    data,
    xField: 'date' as const,
    yField: 'count' as const,
    smooth: true,
    point: { size: 3 },
  };

  return <Line {...config} />;
}
