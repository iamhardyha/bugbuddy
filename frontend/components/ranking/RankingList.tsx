'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Segmented, Skeleton, Empty, Typography, message } from 'antd';
import RankingRow from './RankingRow';
import RankingMyBanner from './RankingMyBanner';
import { fetchRanking, type RankingPeriod, type RankingOffset, type RankingResponse } from '@/lib/rankings';
import styles from './RankingList.module.css';

function normalizePeriod(raw: string | null): RankingPeriod {
  if (raw === 'weekly' || raw === 'monthly') return raw;
  return 'all';
}

function normalizeOffset(raw: string | null): RankingOffset {
  return raw === 'previous' ? 'previous' : 'current';
}

function formatRange(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const s = start.slice(0, 10);
  const e = end.slice(0, 10);
  return `${s} ~ ${e}`;
}

export default function RankingList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = normalizePeriod(searchParams.get('scope'));
  const offset = normalizeOffset(searchParams.get('offset'));

  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    fetchRanking(period, offset, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setLoading(false);
        message.error('랭킹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
        console.error(err);
      });

    return () => controller.abort();
  }, [period, offset]);

  const updateParams = useCallback(
    (next: { scope?: RankingPeriod; offset?: RankingOffset }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.scope) params.set('scope', next.scope);
      if (next.scope === 'all') params.delete('offset');
      else if (next.offset) params.set('offset', next.offset);
      router.replace(`/rankings?${params.toString()}`);
    },
    [router, searchParams],
  );

  const showPeriodXp = period !== 'all';
  const rangeLabel = useMemo(
    () => (data ? formatRange(data.rangeStart, data.rangeEnd) : null),
    [data],
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <Segmented
          value={period}
          onChange={(value) => updateParams({ scope: value as RankingPeriod, offset: 'current' })}
          options={[
            { label: '전체', value: 'all' },
            { label: '주간', value: 'weekly' },
            { label: '월간', value: 'monthly' },
          ]}
          block
        />
        {period !== 'all' && (
          <Segmented
            value={offset}
            onChange={(value) => updateParams({ scope: period, offset: value as RankingOffset })}
            options={[
              { label: '이번', value: 'current' },
              { label: '지난', value: 'previous' },
            ]}
          />
        )}
        {rangeLabel && (
          <Typography.Text type="secondary">기간: {rangeLabel}</Typography.Text>
        )}
      </div>

      {data && <RankingMyBanner myRank={data.myRank} showPeriodXp={showPeriodXp} />}

      {loading && !data && (
        <div className={styles.list}>
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} active paragraph={{ rows: 1 }} />
          ))}
        </div>
      )}

      {data && data.topRankings.length === 0 && (
        <Empty description="이 기간에는 아직 랭킹이 없어요" />
      )}

      {data && data.topRankings.length > 0 && (
        <div className={styles.list}>
          {data.topRankings.map((row) => (
            <RankingRow key={row.userId} row={row} showPeriodXp={showPeriodXp} />
          ))}
        </div>
      )}
    </>
  );
}
