import { useState } from 'react';

export default function StreamerInfoBar({ user, onKeyRegenerated }) {
  const [copied, setCopied] = useState(false);

  const serverHost = window.location.hostname;
  const rtmpUrl = `rtmp://${serverHost}:1935/app`;
  const streamKey = user?.stream_key || user?.streamKey || '-';
  const fullName = `${user?.first_name || user?.username || ''} ${user?.last_name || ''}`.trim();

  function handleCopyKey() {
    if (streamKey === '-') return;
    navigator.clipboard.writeText(streamKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerateKey() {
    try {
      const res = await fetch('/api/users/regenerate-key', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.stream_key) {
        onKeyRegenerated(data.stream_key); // ACCESSO DIRETTO
      }
    } catch (err) {
      console.error('Errore rigenerazione key:', err);
    }
  }

  return (
    <div className="streamer-info-bar">
      <div><strong>Nome:</strong> <span>{fullName}</span></div>
      <div><strong>Username:</strong> <span>{user?.username}</span></div>
      <div><strong>Server RTMP:</strong> <span>{rtmpUrl}</span></div>
      <div><strong>Stream Key:</strong> <span>{streamKey}</span></div>

      <div className="streamer-actions">
        <button className="secondary" onClick={handleCopyKey}>
          {copied ? 'Copiata! ✅' : 'Copia Key'}
        </button>
        <button className="secondary" onClick={handleRegenerateKey}>
          Rigenera
        </button>
      </div>
    </div>
  );
}