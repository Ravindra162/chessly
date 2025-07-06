import { createContext, useEffect, useState } from "react";
import axios from "axios";
export const LoadingContext = createContext();

export function LoadingContextProvider({ children }) {
    const [isLoading, setIsLoading] = useState(true);

    

    return (
        <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}
