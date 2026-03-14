'use client';

import { useEffect, useRef } from 'react';
import { getAccessToken } from '@/lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface ChatRoomEvent {
  type: 'ROOM_CLOSED' | 'NEW_MESSAGE' | 'ROOM_ACCEPTED';
  roomId: number;
  status: string | null;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
}

/**
 * 유저별 채팅 이벤트 구독 — /topic/user/{userId}/chat-events
 * 채팅 목록 실시간 업데이트, 채팅방 상태 변경 알림에 사용.
 */
export function useUserChatEvents(
  userId: number | null | undefined,
  onEvent: (event: ChatRoomEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!userId) return;

    let active = true;
    let clientInstance: import('@stomp/stompjs').Client | null = null;

    async function connect() {
      const token = getAccessToken();
      const [{ Client }, { default: SockJS }] = await Promise.all([
        import('@stomp/stompjs'),
        import('sockjs-client'),
      ]);

      if (!active) return;

      const client = new Client({
        webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
        connectHeaders: { Authorization: `Bearer ${token ?? ''}` },
        reconnectDelay: 3000,
        onConnect: () => {
          if (!active) { client.deactivate(); return; }
          client.subscribe(`/topic/user/${userId}/chat-events`, frame => {
            try {
              onEventRef.current(JSON.parse(frame.body) as ChatRoomEvent);
            } catch { /* ignore parse errors */ }
          });
        },
      });

      client.activate();
      clientInstance = client;
    }

    connect();

    return () => {
      active = false;
      clientInstance?.deactivate();
      clientInstance = null;
    };
  }, [userId]);
}
