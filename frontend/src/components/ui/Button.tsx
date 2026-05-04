import { ComponentChildren } from 'preact';

interface ButtonProps {
  children: ComponentChildren;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function Button({ children, onClick, type = 'button', variant = 'primary', size = 'md', disabled, className = '' }: ButtonProps) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-electric-600 hover:bg-electric-500 text-white',
    secondary: 'bg-navy-700 hover:bg-navy-600 border border-navy-600 text-gray-300',
    danger: 'bg-red-700 hover:bg-red-600 text-white',
    ghost: 'text-gray-400 hover:bg-navy-700 hover:text-gray-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
