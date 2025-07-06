import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import CallToAction from './components/CallToAction';

function Landing() {
    useEffect(()=>{
        if(localStorage.getItem('auth_token')) window.location.href = '/home';
    })
  return (
    <div className="bg-black overflow-hidden no-scrollbar ">
      <Navbar />
      <Hero />
      <Features />
      <CallToAction />
    </div>
  );
}

export default Landing;