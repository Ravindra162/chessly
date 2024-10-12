import React from 'react'
import {BrowserRouter ,Routes, Route} from "react-router-dom"
import Play from './pages/Play'
import "./App.css"
import Png from './pages/Pgn'
import Room from './pages/Room'

const App = () => {
  return (
    <>
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/room" element={<Room/>} />
        <Route path="/play" element={<Play/>} />
        <Route path='/pgn' element={<Png/>} />
      </Routes>
    </BrowserRouter>
    </>
    </>
  )
}

export default App