import React, { useState } from 'react';
import { Button } from "@nextui-org/react";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/auth/register`, {
        email,
        username,
        password,
      });

      if (response.status === 201) {
        alert('Registration successful!');
        navigate('/random'); // Redirect to /random on success
      }
    } catch (error) {
      if (error.response && error.response.data) {
        alert(error.response.data.message);
      } else {
        console.error('Error registering:', error);
        alert('An error occurred during registration. Please try again.');
      }
    }
  };

  return (
    <div id='auth' className='h-screen w-full bg-[#171717ec] flex flex-col justify-center items-center gap-5'>
      <h1 className='text-3xl text-white'>Register and Play now</h1>
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
          type='text' 
          placeholder='Enter your username' 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input 
          className='h-[50px] w-[90%] bg-[#00000081] border-2 border-[#72a244] rounded-md text-white text-md text-center' 
          type='password' 
          placeholder='Enter your password' 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input 
          className='h-[50px] w-[90%] bg-[#00000081] border-2 border-[#72a244] rounded-md text-white text-md text-center' 
          type='password' 
          placeholder='Confirm your password' 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        
        <Button className='bg-[#72a244]' onClick={handleRegister}>
          Register
        </Button>
        <span>
          <Link className='text-white' to="/login">Already registered?</Link>
        </span>
      </div> 
    </div>
  );
};

export default Register;
