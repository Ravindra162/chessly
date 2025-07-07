import React, { useState } from 'react';
import { Button } from "@nextui-org/react";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getApiUrl } from '../../config/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(getApiUrl('/auth/login'), { email, password });
      if (response.status === 200) {
        localStorage.setItem('auth_token', response.data.token);
        toast.success('Welcome back!');
        setTimeout(() => navigate('/home'), 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">Enter your credentials to continue</p>
        </div>
        
        <div className="bg-[#111] p-8 rounded-xl border border-[#16A34A]/20 shadow-lg shadow-[#16A34A]/10">
          <div className="space-y-6">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-[#16A34A]/30 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#16A34A] transition"
                placeholder="Email address"
              />
            </div>
            
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-[#16A34A]/30 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#16A34A] transition"
                placeholder="Password"
              />
            </div>

            <Button
              onClick={handleLogin}
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-[#16A34A] hover:text-[#15803d] transition-colors">
              Don't have an account? Register
            </Link>
          </div>
        </div>
      </div>
      <ToastContainer 
        position="top-right"
        theme="dark"
      />
    </div>
  );
};

export default Login;