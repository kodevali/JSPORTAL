
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
}

const Logo: React.FC<LogoProps> = ({ className = "w-48", variant = 'full' }) => {
  // We ignore 'variant' for now as the user requested a 1:1 reconstruction using specific PNG files.
  return (
    <div className={className}>
      <img 
        src="logo.png" 
        alt="JS Bank" 
        className="block dark:hidden w-full h-auto object-contain"
      />
      <img 
        src="darklogo.png" 
        alt="JS Bank" 
        className="hidden dark:block w-full h-auto object-contain"
      />
    </div>
  );
};

export default Logo;
