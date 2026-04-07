'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getAccessToken } from '@/lib/auth';
import type { ChatMessage } from '@/types/chat';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export function useStompChat(roomId: number, onMessage: (msg: ChatMessage) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const clientRef = useRef<import('@stomp/stompjs').Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;

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
        beforeConnect: () => {
          const freshToken = getAccessToken();
          client.connectHeaders = { Authorization: `Bearer ${freshToken ?? ''}` };
        },
        reconnectDelay: 3000,
        onConnect: () => {
          if (!active) { client.deactivate(); return; }
          setConnected(true);
          client.subscribe(`/topic/chat/${roomId}`, frame => {
            try {
              onMessageRef.current(JSON.parse(frame.body) as ChatMessage);
            } catch { /* ignore */ }
          });
        },
        onDisconnect: () => setConnected(false),
        onStompError: () => setConnected(false),
      });

      client.activate();
      clientRef.current = client;
    }

    connect();

    return () => {
      active = false;
      clientRef.current?.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [roomId]);

  const sendMessage = useCallback((content: string) => {
    clientRef.current?.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify({ content, messageType: 'TEXT' }),
    });
  }, [roomId]);

  return { connected, sendMessage };
}
