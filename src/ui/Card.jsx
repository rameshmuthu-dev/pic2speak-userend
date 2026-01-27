import React from 'react';

const Card = ({ icon, title, desc, iconColor, iconBg }) => {
  return (
    /* items-center and text-center align everything to the middle */
    <div className="group p-8 rounded-3xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-teal-100 transition-all duration-300 transform hover:scale-105 flex flex-col items-center text-center">
      
      {/* Icon Container - Now centered */}
      <div className={`w-16 h-16 ${iconBg} ${iconColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      
      {/* Title - Centered */}
      <h3 className="text-xl font-bold text-slate-900 mb-3">
        {title}
      </h3>
      
      {/* Description - Centered */}
      <p className="text-slate-600 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  );
};

export default Card;