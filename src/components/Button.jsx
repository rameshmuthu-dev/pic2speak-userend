import React from 'react';

const Button = ({ children, onClick, type = "button", variant = "primary", className = "" }) => {
  // Direct Tailwind classes
  const variants = {
    primary: "bg-[#5FA8D3] text-white shadow-lg shadow-[#5FA8D3]/20 hover:opacity-90",
    outline: "border-2 border-[#5FA8D3] text-[#5FA8D3] hover:bg-[#5FA8D3] hover:text-white",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all duration-300 active:scale-95 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;