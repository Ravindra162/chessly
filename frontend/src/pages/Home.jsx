import { Button } from '@nextui-org/react'
import React, { useEffect, useState } from 'react'
import Navbar from "../components/Navbar"
import { useContext } from 'react'
import { UserContext } from '../context/UserContext'
import {Card, CardFooter, Image} from "@nextui-org/react";
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../context/SocketContext'
import Matches from '../components/Matches'
const Home = () => {
  const [User, setUser] = useState("")
  const user = useContext(UserContext)
  const socket = useContext(SocketContext)
  const navigate = useNavigate()
  useEffect(()=>{
      console.log("User data:", user)
      if(user!==null)
      setUser(user)
  },[user])
  // useEffect(()=>{
  //   if(!socket)return
  //   socket.onmessage = (data) => {
  //     console.log(JSON.parse(data.data))
  //     const parsedData = JSON.parse(data.data)
  //     if(parsedData.type==="game_created"){
  //       // navigate("/game/"+parsedData.gameId)
  //       navigate("/ten/")
  //     }
  //   }
  // },[socket])

  const handleMatchMaking = () => {
    console.log("Matchmaking.......")
    if(socket)
    socket.send(JSON.stringify({type:"start_10", userId:User.user.id}))
    navigate("/ten/")
  }
// bg-[#302E2B]
  return (
    <div className='h-screen w-full  home'>
      <Navbar/>
      <div className='h-[92%] w-full bg--300 main'>
          <div className='h-1/2 w-full flex justify-center items-center'>

         <div className='text-white block'>
         {User===''?"Loading.....":User.user.email}</div>
         <Button onClick={handleMatchMaking} className='bg-green-400'>
            Play random
          </Button>
          </div>
          
         <Matches/>

      </div>
      

    </div>
  )
}

export default Home