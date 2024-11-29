import { createContext, useEffect, useState } from "react";

export const SocketContext = createContext();

import { LoadingContext } from "./LoadingContext";
import { useContext } from "react";

export function SocketContextProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Create a new WebSocket connection to the server
        // const newSocket = new WebSocket("wss://chessly.onrender.com");
        // setIsLoading(true)
        setIsLoading(true)
        const newSocket = new WebSocket("ws://localhost:5000");

        // Set up event listeners for open, close, error, etc.
        newSocket.onopen = () => {
            console.log("WebSocket connection established");
            setIsLoading(false)
        };

        newSocket.onclose = (event) => {
            console.log("WebSocket connection closed:", event.code, event.reason);
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
            {isLoading ? <div>establishing real time connection</div> : children}
        </SocketContext.Provider>
    );
}
