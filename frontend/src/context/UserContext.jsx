import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
export const UserContext = createContext();
import { ToastContainer, toast } from 'react-toastify';
import { LoadingContext } from "./LoadingContext";
import 'react-toastify/dist/ReactToastify.css';
import Loading from "../components/Loading";
import { getApiUrl, getAuthHeaders } from '../config/api';

export function UserContextProvider({ children }) {
    const navigate = useNavigate();
    const {isLoading,setIsLoading} = useContext(LoadingContext);
    const [user, setUser] = useState("");
    const fetchSuccess = () => toast("User fetched successfully");
    const fetchFail = () => toast("Fetch failed");

    useEffect(() => {
        console.log("useEffect triggered in UserContextProvider");
        setIsLoading(true);
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
            axios.get(getApiUrl('/user/user'), getAuthHeaders())
            .then((response) => {
                console.log("User data fetched:", response);
                setTimeout(()=>{
                    setIsLoading(false);
                },1000)
                setUser(response.data.user);
                console.log(response.data.user)
                fetchSuccess();
            })
            .catch((error) => {
                navigate("/login");
                fetchFail();
                setUser(null);
               
                console.error('Error fetching user:', error);
                
            });
        };
    
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user }}>
            {/* {isLoading?
            <div className="h-screen w-full bg-black flex justify-center items-center">
                <div>
                    <h1 className="text-white">Loading.....</h1>
                </div>
            </div>:children} */}
            {isLoading?
            <Loading/>:children}
        </UserContext.Provider>
    );
}
