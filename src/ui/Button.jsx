import React from 'react';

const Button = ({ children, onClick, className = "", variant = "primary", disabled = false, type = "button" }) => {
  
  const baseStyles = "px-6 py-3 rounded-2xl font-bold transition-all duration-300 active:scale-95 w-full disabled:opacity-50 disabled:active:scale-100";
  
  const variants = {
    primary: "bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-100",
    
    // Feedback Submit Button Color (Bright Teal)
    brand: "bg-[#00A884] text-white hover:bg-[#008F6F] shadow-lg shadow-[#00A88422] uppercase tracking-widest text-sm",
    
    // PRO TIP STYLE (Darker Greenish-Teal combination)
    // Intha color Pro Tip box-il irukkum antha exact shade
    accent: "bg-[#006D5B] text-white hover:bg-[#005244] border border-[#008F6F] shadow-inner",
    
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    
    outline: "bg-transparent border-2 border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;