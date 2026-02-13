import React from 'react';

const Loading = ({ message = "Loading...", fullPage = false }) => {
  const containerClasses = fullPage 
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm" 
    : "flex flex-col items-center justify-center p-10 w-full";

  return (
    <div className={containerClasses}>
      {/* Outer Spinner Ring */}
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-100 rounded-full"></div>
        {/* Animated Inner Ring */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      {/* Pulsing Message */}
      <p className="mt-4 text-slate-600 font-bold tracking-wide animate-pulse uppercase text-xs">
        {message}
      </p>
    </div>
  );
};

export default Loading;