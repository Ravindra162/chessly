import React, { useState } from 'react';
import { Button } from "@nextui-org/react";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const loginSuccess =()=> toast("Login Success")
  const loginFailed = () => toast("Login Failed due to an error")

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please fill in both email and password.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/auth/login', { email, password });

      if (response.status === 200) {
        const { token } = response.data;
        localStorage.setItem('auth_token', token); // Store token in localStorage
        loginSuccess()
        setTimeout(()=>{
          navigate('/');
        },1000)
         // Redirect to /random on successful login
      }
    } catch (error) {
      if (error.response && error.response.data) {
        alert(error.response.data.message);
      } else {
        console.error('Error logging in:', error);
        alert('An error occurred during login. Please try again.');
      }
    }
  };

  return (
    <div id='auth' className='h-screen w-full bg-[#171717ec] flex flex-col justify-center items-center gap-5'>
      <h1 className='text-3xl text-white'>Login to Play</h1>
      <div className='form h-1/2 sm:w-[70%] md:w-[45%] w-[75%] border-2 border-[#72a244] rounded-2xl shadow-md shadow-[#72a244] flex flex-col justify-center items-center gap-5 bg-[#0D302C]'>
        <input 
          className='h-[50px] w-[90%] bg-[#00000081] border-2 border-[#72a244] rounded-md text-white text-md text-center' 
          type='email' 
          placeholder='Enter your email' 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          className='h-[50px] w-[90%] bg-[#00000081] border-2 border-[#72a244] rounded-md text-white text-md text-center' 
          type='password' 
          placeholder='Enter your password' 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <Button className='bg-[#72a244]' onClick={handleLogin}>
          Login
        </Button>
        <span>
          <Link className='text-white' to="/register">Don't have an account? Register</Link>
        </span>
      </div> 
      <ToastContainer/>
    </div>
  );
};

export default Login;
