import React from 'react';

interface ToothIconProps {
  className?: string;
}

const ToothIcon: React.FC<ToothIconProps> = ({ className = "h-6 w-6" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 2C6.5 2 4 6 4 9C4 12 4.5 15 6 17C7.5 19 10 22 12 22C14 22 16.5 19 18 17C19.5 15 20 12 20 9C20 6 17.5 2 12 2Z" />
      <path d="M12 2C9.5 2 8 4 8 6C8 8 9.5 9 12 9C14.5 9 16 8 16 6C16 4 14.5 2 12 2Z" />
    </svg>
  );
};

export default ToothIcon;
