import { createContext, useEffect, useState } from "react";

export const SocketContext = createContext();

export function SocketContextProvider({ children }) {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Create a new WebSocket connection to the server
        const newSocket = new WebSocket("ws://localhost:3000");

        // Set up event listeners for open, close, error, etc.
        newSocket.onopen = () => {
            console.log("WebSocket connection established");
        };

        newSocket.onclose = () => {
            console.log("WebSocket connection closed");
        };

        newSocket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        setSocket(newSocket);

        // Cleanup the WebSocket connection when the component unmounts
        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}
