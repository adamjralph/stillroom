import React from 'react';

// Minimal Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  isLoading,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-neutral-900 text-white hover:bg-black focus:ring-neutral-500 rounded-sm",
    secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-300 rounded-sm",
    outline: "border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 focus:ring-neutral-200 rounded-sm",
    ghost: "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 rounded-sm px-3 py-2"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {isLoading ? <span className="animate-pulse">Processing...</span> : children}
    </button>
  );
};

// Minimal Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">{label}</label>}
      <input 
        className={`w-full px-3 py-2.5 bg-neutral-50 border border-transparent focus:bg-white focus:border-neutral-300 focus:ring-0 transition-all duration-200 text-sm text-neutral-900 placeholder-neutral-400 rounded-sm ${className}`}
        {...props}
      />
    </div>
  );
};

// Label
export const Label: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">
    {children}
  </label>
);
