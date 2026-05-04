import { ComponentChildren } from 'preact';

export function Layout({ children }: { children: ComponentChildren }) {
  return <div class="min-h-screen bg-navy-900">{children}</div>;
}
