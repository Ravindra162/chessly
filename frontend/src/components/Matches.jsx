import React, { useContext } from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@nextui-org/react'
import { UserContext } from '../context/UserContext'
import axios from "axios"
function Matches() {
    
    const [games,setGames] = useState([])
    const user = useContext(UserContext)

    useEffect(()=>{
        axios.get(`https://chessly-1.onrender.com
/user/games`,{
            headers:{
                'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
            }
        }).then(res=>{
            console.log(res);
            setGames(res.data.games)
        })
        .catch(err=>{
            console.log(err)
        })
    },[])

    const handleCopyPgn = (pgn) => {
        navigator.clipboard.writeText(pgn)
        alert("Pgn copied to clipboard")
    }

  return (
    <div className='h-1/2 w-full bg- flex flex-col justify-center items-center'>
        <h1 className='text-xl md:text-3xl text-white font-bold '>
            <u>    Matches</u>
        </h1>
        <div className='h-[90%] w-[90%] md:w-2/3 overflow-y-scroll p-5 no-scrollbar'>
        <div className='h-full w-full flex flex-col bg-[#171616c9] rounded-xl p-8  items-center'>
        {       
                games.length?games.map((game,index)=>{
                    return (<div className='h-[60px] w-full flex flex-col justify-between items-center ' key={index}><div className='h-[60px] w-full rounded-lg flex justify-between ' >

                                <div className={` h-full md:w-1/3 flex justify-center items-center  ${game.winnerId!==user.user.id?'text-green-400':'text-red-700'} font-semibold text-sm  md:text-xl`}>{game.whiteUsername+" (w)"}</div>
                                <div className={`opponent h-full md:w-1/3 flex justify-center items-center  ${game.winnerId===user.user.id?'text-green-400':'text-red-700'} font-semibold w-1/3  text-sm md:text-xl`}>{game.blackUsername+" (b)"}</div>
                                <Button 
                                onClick={()=>handleCopyPgn(game.pgn)}
                                className='me h-[90%] w-[10%] flex justify-center items-center bg-white text-black'>
                                Copy Pgn
                                </Button>
                                

                            </div>
                            <div className='h-[2px] w-full my-3 bg-white'>

                            </div>
                            </div>)
                }):
                <><div className='text-center text-white'>
                    No games found  
                </div></>
            }
        </div>
           
        </div>
    </div>
  )
}

export default Matches