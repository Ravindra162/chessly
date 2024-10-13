import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
export const UserContext = createContext();
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function UserContextProvider({ children }) {
    const [user, setUser] = useState("");
    const fetchSuccess = () => toast("User fetched successfully");
    const fetchFail = () => toast("Fetch failed");

    useEffect(() => {
        console.log("useEffect triggered in UserContextProvider");

        const fetchUser = () => {
            const token = localStorage.getItem('auth_token');
            console.log("Auth token:", token);
    
            // If no token, navigate to login page.
            if (!token) {
                console.log("No token found, redirecting to login");
                navigate("/login");
                return;
            }
    
            // Make the axios request and handle the response using .then() and .catch()
            axios.get('http://localhost:3000/user/user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                console.log("User data fetched:", response);
                setUser(response.data.user);
                fetchSuccess();
            })
            .catch((error) => {
                console.error('Error fetching user:', error);
                setUser(null);
                fetchFail();
            });
        };
    
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user }}>
            <ToastContainer />
            {children}
        </UserContext.Provider>
    );
}
