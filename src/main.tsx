import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/selector.css';
import './styles/ux-overrides.css';
import './styles/curve-workspace.css';

const rootNode = document.getElementById('root') ?? document.getElementById('apgs-pump-selector');
if (!rootNode) throw new Error('APGS selector root not found');
ReactDOM.createRoot(rootNode).render(<React.StrictMode><App/></React.StrictMode>);
