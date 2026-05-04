import { render } from 'preact';
import './index.css';
import { App } from './app';
import { ThemeProvider } from './contexts/ThemeContext';

render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
  document.getElementById('app')!
);
