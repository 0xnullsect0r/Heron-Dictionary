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
    primary: 'bg-brand hover:bg-brand-hover text-text-primary',
    secondary: 'bg-bg-elevated hover:bg-bg-hover border border-border text-text-secondary hover:text-text-primary',
    danger: 'bg-danger/80 hover:bg-danger text-text-primary',
    ghost: 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

