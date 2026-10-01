import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/opendyslexic/400.css';
import { App } from './app/App';
import { installHowlerAudio } from './audio/HowlerAudio';
import './styles/global.css';

installHowlerAudio();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
