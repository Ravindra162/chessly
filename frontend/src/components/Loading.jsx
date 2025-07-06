import React from 'react';

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full ">
      <div className="relative w-64 h-4 bg-black rounded-full overflow-hidden border border-[#16A34A]/20">
        <div className="absolute top-0 left-0 h-full w-1/2 bg-[#16A34A] rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
      </div>
      <p className="mt-4 text-[#16A34A] font-medium animate-pulse">Loading...</p>
      
      <style>
        {`
          @keyframes loading {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Loading;
