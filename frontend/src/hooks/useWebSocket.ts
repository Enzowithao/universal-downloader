import { useEffect, useRef, useState, useCallback } from 'react';
import { API_URL } from '../config';

interface WebSocketMessage {
    type: string;
    taskId?: string;
    status?: string;
    progress?: number;
    speed?: string;
    eta?: string;
    title?: string;
    error?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const handlersRef = useRef<MessageHandler[]>([]);

    const connect = useCallback(() => {
        // Prevent multiple connections
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const clientId = Math.random().toString(36).substring(7);
        // Convert http(s) to ws(s)
        const wsUrl = API_URL.replace(/^http/, 'ws') + `/ws/${clientId}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('✅ WebSocket Connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handlersRef.current.forEach(handler => handler(data));
            } catch (e) {
                console.error('WebSocket JSON Parse Error:', e);
            }
        };

        ws.onclose = () => {
            console.log('❌ WebSocket Disconnected');
            setIsConnected(false);
            // Auto reconnect after 3s
            setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
            // Suppress verbose error logging for connection refused/closed
            // console.error('WebSocket Error:', error);
            ws.close();
        };

        wsRef.current = ws;
    }, []);

    useEffect(() => {
        connect();
        return () => {
            wsRef.current?.close();
        };
    }, [connect]);

    const subscribe = useCallback((handler: MessageHandler) => {
        handlersRef.current.push(handler);
        return () => {
            handlersRef.current = handlersRef.current.filter(h => h !== handler);
        };
    }, []);

    return { isConnected, subscribe };
};
