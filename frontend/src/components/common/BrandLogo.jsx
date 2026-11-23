import React from 'react';
import logoImg from '../../assets/logo.jpg';

export const FoodClocheIcon = ({ className = "w-6 h-6", color = "#dfc9a5" }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer circle */}
    <circle cx="50" cy="50" r="46" fill="#0b1329" stroke={color} strokeWidth="3" />
    <circle cx="50" cy="50" r="41" stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
    
    {/* Cloche knob */}
    <ellipse cx="50" cy="30" rx="4" ry="2.5" fill={color} />
    
    {/* Cloche dome */}
    <path
      d="M26 62C26 44.5 36.5 33 50 33C63.5 33 74 44.5 74 62H26Z"
      fill={color}
    />
    
    {/* Cloche highlight shine */}
    <path
      d="M50 36C59 36 67 43 69 57"
      stroke="#0b1329"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.3"
    />
    
    {/* Cloche platter base */}
    <rect x="23" y="62" width="54" height="4" rx="2" fill={color} />
  </svg>
);

const BrandLogo = ({ size = "md", showTagline = false, lightText = false }) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logoImg}
        alt="Tasty House Logo"
        className={`rounded-full border border-gold/40 shadow-sm object-cover ${
          size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'
        }`}
        onError={(e) => {
          // If image load fails, replace with SVG fallback
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className="hidden">
        <FoodClocheIcon className={size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'} />
      </div>

      <div>
        <span
          className={`font-display font-extrabold tracking-wider block uppercase ${
            lightText ? 'text-white' : 'text-navy-900'
          } ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}`}
        >
          TASTY HOUSE
        </span>
        {showTagline && (
          <span className="text-[10px] text-stone-400 font-medium tracking-wide block">
            A Taste to Remember
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
