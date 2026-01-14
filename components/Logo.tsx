
import React from 'react';

interface LogoProps {
  className?: string;
}

/**
 * JS Bank Logo Component
 * Loads logo.png for light mode and darklogo.png for dark mode.
 * Both files are expected to be in the project root.
 */
const Logo: React.FC<LogoProps> = ({ className = "w-48" }) => {
  return (
    <div className={`${className} flex items-center justify-center`}>
      {/* Light Mode Logo */}
      <img 
        src="logo.png" 
        alt="JS Bank" 
        className="block dark:hidden w-full h-auto object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://jsbl.com/wp-content/uploads/2021/06/js-bank-logo.png';
        }}
      />
      
      {/* Dark Mode Logo */}
      <img 
        src="darklogo.png" 
        alt="JS Bank" 
        className="hidden dark:block w-full h-auto object-contain"
        onError={(e) => {
          // Fallback if darklogo.png is missing: use a high-contrast version or the standard logo
          (e.target as HTMLImageElement).src = 'logo.png';
        }}
      />
    </div>
  );
};

export default Logo;
