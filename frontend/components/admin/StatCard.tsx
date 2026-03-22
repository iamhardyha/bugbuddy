'use client';

import React from 'react';
import { Card, Statistic } from 'antd';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading?: boolean;
}

export default function StatCard({ title, value, icon, loading }: StatCardProps) {
  return (
    <Card>
      <Statistic title={title} value={value} prefix={icon} loading={loading} />
    </Card>
  );
}
