
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`${className} flex flex-col items-center justify-center`}>
      <span className="text-3xl font-black tracking-tighter text-[#044A8D] dark:text-white transition-colors duration-300">
        JS<span className="text-[#EF7A25]">BANK</span>
      </span>
    </div>
  );
};

export default Logo;
