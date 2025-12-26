import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/80376fec-ba63-42de-a07a-af79a6d957d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:7',message:'Public URL check',data:{publicUrl:process.env.PUBLIC_URL,hostname:window.location.hostname,pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
// #endregion

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

