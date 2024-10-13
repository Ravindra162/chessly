import { Button } from '@nextui-org/react'
import React, { useEffect, useState } from 'react'
import Navbar from "../components/Navbar"
import { useContext } from 'react'
import { UserContext } from '../context/UserContext'
import {Card, CardFooter, Image} from "@nextui-org/react";
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../context/SocketContext'
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
  useEffect(()=>{
    if(!socket)return
    socket.onmessage = (data) => {
      console.log(JSON.parse(data.data))
      const parsedData = JSON.parse(data.data)
      if(parsedData.type==="game_created"){
        // navigate("/game/"+parsedData.gameId)
        navigate("/game/"+parsedData.gameId)
      }
    }
  },[socket])

  const handleMatchMaking = () => {
    console.log("Matchmaking.......")
    socket.send(JSON.stringify({type:"start_10", userId:User.user.id}))
  }

  return (
    <div className='h-screen w-full bg-[#302E2B]'>
      <Navbar/>
      <div className='h-[93%] w-full bg--300 main'>
          <div className='h-1/2 w-full bg--100 flex justify-center items-center'>
           <Card
         isFooterBlurred
          radius="lg"
          className="border-none h-1/2 w-[200px]"
          >
            <Image
              alt="Woman listing to music"
              className="object-cover"
              height={220}
              src="https://nextui.org/images/hero-card.jpeg"
              width={200}
              />
            <div>
            </div>
         </Card>
         <div className='text-white'>
         {User===''?"Loading.....":User.user.email}</div>
          </div>
          <Button
          onClick={handleMatchMaking}
          className='bg-[#72a244]'>Play 10min</Button>
      </div>

    </div>
  )
}

export default Home