import { ComponentChildren } from 'preact';

export function Card({ children, className = '' }: { children: ComponentChildren; className?: string }) {
  return (
    <div className={`bg-navy-800 border border-navy-700 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ComponentChildren; className?: string }) {
  return (
    <div className={`px-6 py-4 border-b border-navy-700 flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: ComponentChildren; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
