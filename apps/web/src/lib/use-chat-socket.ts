"use client";

import { useEffect, useRef } from "react";

export type ChatEvent =
  | { type: "message"; conversation_id: string }
  // Сокет (пере)подключился: события, пришедшие пока его не было, потеряны — пора дочитать.
  | { type: "connected"; reconnect: boolean };

/**
 * Подписка на события чата по WebSocket (KAN-127). Сервер сообщает только «в диалоге X новое»,
 * само сообщение дочитываем по REST. Переподключение с паузой, ping раз в 25 секунд,
 * чтобы прокси не закрывал простаивающее соединение.
 */
export function useChatSocket(onEvent: (e: ChatEvent) => void) {
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let ping: ReturnType<typeof setInterval> | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let delay = 1000;
    let opened = false;

    function connect() {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${window.location.host}/api/chats/ws`);
      ws.onopen = () => {
        handler.current({ type: "connected", reconnect: opened });
        opened = true;
        delay = 1000;
        ping = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send("ping"), 25_000);
      };
      ws.onmessage = (m) => {
        try {
          handler.current(JSON.parse(m.data) as ChatEvent);
        } catch {
          /* не наше сообщение — игнорируем */
        }
      };
      ws.onclose = () => {
        clearInterval(ping);
        if (!stopped) retry = setTimeout(connect, (delay = Math.min(delay * 2, 30_000)));
      };
    }
    connect();
    return () => {
      stopped = true;
      clearInterval(ping);
      clearTimeout(retry);
      ws?.close();
    };
  }, []);
}
