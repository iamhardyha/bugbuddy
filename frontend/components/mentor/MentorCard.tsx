'use client';

import { useRouter } from 'next/navigation';
import { StarFilled } from '@ant-design/icons';
import type { MentorCard as MentorCardType } from '@/types/mentor';
import { getLevelMeta } from '@/lib/userMeta';
import styles from './MentorCard.module.css';

interface Props {
  mentor: MentorCardType;
}

export default function MentorCard({ mentor }: Props) {
  const router = useRouter();
  const levelMeta = getLevelMeta(mentor.level);
  const rating = mentor.mentorAvgRating;

  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/users/${mentor.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') router.push(`/users/${mentor.id}`);
      }}
    >
      <div className={styles.top}>
        <div className={styles.avatar}>
          {mentor.nickname.charAt(0).toUpperCase()}
        </div>
        <div className={styles.identity}>
          <span className={styles.nickname}>{mentor.nickname}</span>
          <div className={styles.meta}>
            <span className={styles.levelBadge}>
              {levelMeta.emoji} Lv.{mentor.level}
            </span>
            <span className={styles.rating}>
              <StarFilled />{' '}
              {rating != null
                ? `${Number(rating).toFixed(1)} (${mentor.mentorRatingCount})`
                : '평점 없음'}
            </span>
          </div>
        </div>
      </div>
      <p className={`${styles.bio}${mentor.bio ? '' : ` ${styles.bioEmpty}`}`}>
        {mentor.bio || '자기소개가 아직 없어요.'}
      </p>
    </div>
  );
}
