
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
}

/**
 * Logo component that automatically switches between light and dark versions.
 * - logo.png: Visible in light mode (standard version for light backgrounds)
 * - darklogo.png: Visible in dark mode (inverted version for dark backgrounds)
 */
const Logo: React.FC<LogoProps> = ({ className = "w-48", variant = 'full' }) => {
  return (
    <div className={`${className} flex items-center justify-center transition-opacity duration-300`}>
      {/* Light Mode Logo */}
      <img 
        src="logo.png" 
        alt="JS Bank" 
        className="block dark:hidden w-full h-auto object-contain"
        loading="eager"
      />
      
      {/* Dark Mode Logo */}
      <img 
        src="darklogo.png" 
        alt="JS Bank" 
        className="hidden dark:block w-full h-auto object-contain"
        loading="eager"
      />
    </div>
  );
};

export default Logo;
