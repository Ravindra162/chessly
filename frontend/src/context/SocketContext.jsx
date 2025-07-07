import { createContext, useEffect, useState, useRef } from "react";
import { API_CONFIG } from "../config/api";

export const SocketContext = createContext();

import { LoadingContext } from "./LoadingContext";
import { useContext } from "react";
import Loading from "../components/Loading";

export function SocketContextProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    const connectWebSocket = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            return;
        }

        setIsLoading(true);
        console.log("Attempting to connect to WebSocket...");
        
        const newSocket = new WebSocket(API_CONFIG.WEBSOCKET_URL);

        newSocket.onopen = () => {
            console.log("WebSocket connection established");
            setIsLoading(false);
            setIsConnected(true);
            reconnectAttemptsRef.current = 0;
        };

        newSocket.onclose = (event) => {
            console.log("WebSocket connection closed:", event.code, event.reason);
            setIsConnected(false);
            setSocket(null);
            
            // Attempt to reconnect if not intentionally closed
            if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                console.log(`Attempting to reconnect in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
                
                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectAttemptsRef.current++;
                    connectWebSocket();
                }, delay);
            } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                console.error("Max reconnection attempts reached");
                setIsLoading(false);
            }
        };

        newSocket.onerror = (error) => {
            console.error("WebSocket error:", error);
            setIsLoading(false);
        };

        setSocket(newSocket);
    };

    useEffect(() => {
        connectWebSocket();

        // Cleanup the WebSocket connection when the component unmounts
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socket) {
                socket.close(1000, "Component unmounting");
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, reconnect: connectWebSocket }}>
            {isLoading ? <Loading/> : children}
        </SocketContext.Provider>
    );
}
