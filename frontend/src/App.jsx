import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Play from './pages/Play'
import "./App.css"
import Png from './pages/Pgn'
import ViewGame from './pages/ViewGame'
import Room from './pages/Room'
import PlayTen from './pages/PlayTen'
import Home from './pages/Home'
import Register from './pages/auth/Register'
import Login from './pages/auth/Login'
import { UserContextProvider } from './context/UserContext'
import { SocketContextProvider } from './context/SocketContext'
import Landing from './pages/landing/Landing'

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('auth_token') // Or however you check if a user is logged in
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path='/' element={<Landing/>} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <UserContextProvider>
                <SocketContextProvider>
                  <Routes>
                    <Route path="/home" element={<Home />} />
                    <Route path="/room" element={<Room />} />
                    <Route path="/game/:id" element={<Play />} />
                    <Route path='/ten' element={<PlayTen />} />
                    <Route path='/pgn' element={<Png />} />
                    <Route path='/view-game' element={<ViewGame />} />
                  </Routes>
                </SocketContextProvider>
              </UserContextProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App