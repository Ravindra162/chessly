import React, { useState } from 'react';
import { Button } from "@nextui-org/react";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!email || !username || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/auth/register', {
        email,
        username,
        password
      });

      if (response.status === 201) {
        toast.success('Registration successful!');
        setTimeout(() => navigate('/login'), 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400">Join the chess community today</p>
        </div>
        
        <div className="bg-[#111] p-8 rounded-xl border border-[#16A34A]/20 shadow-lg shadow-[#16A34A]/10">
          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-[#16A34A]/30 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#16A34A] transition"
              placeholder="Email address"
            />
            
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-[#16A34A]/30 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#16A34A] transition"
              placeholder="Username"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-[#16A34A]/30 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#16A34A] transition"
              placeholder="Password"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-[#16A34A]/30 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#16A34A] transition"
              placeholder="Confirm password"
            />

            <Button
              onClick={handleRegister}
              className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white py-3 rounded-lg font-medium transition-colors"
              isLoading={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-[#16A34A] hover:text-[#15803d] transition-colors">
              Already have an account? Sign in
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

export default Register;