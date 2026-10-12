import { useState, useEffect } from 'react';

export default function Sidebar({ selectedChannel, onSelectChannel, currentUser }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  async function fetchSidebarData() {
    try {
      const resSubs = await fetch('/api/subscriptions', { credentials: 'include' });
      if (resSubs.ok) {
        const data = await resSubs.json();
        setSubscriptions(data.subscriptions || []);
      }

      const resUsers = await fetch('/api/users', { credentials: 'include' });
      if (resUsers.ok) {
        const data = await resUsers.json();
        setAllUsers(data.users || []);
      }
    } catch (err) {
      console.error('Errore caricamento dati Sidebar:', err);
    }
  }

  useEffect(() => {
    fetchSidebarData();
    const timer = setInterval(fetchSidebarData, 5000);
    return () => clearInterval(timer);
  }, []);

  async function handleToggleFollow(e, streamerId, isFollowing) {
    e.stopPropagation();
    try {
      if (isFollowing) {
        await fetch(`/api/subscriptions/${streamerId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      } else {
        await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamer_id: streamerId }),
          credentials: 'include'
        });
      }
      fetchSidebarData();
    } catch (err) {
      console.error('Errore modifica iscrizione:', err);
    }
  }

  const followedIds = new Set(subscriptions.map(s => s.streamer_id));

  return (
    <aside className="sidebar-left">
      <div className="sidebar-block">
        <div className="sidebar-title">📡 I Miei Canali Seguiti</div>
        <div className="scrollable-list">
          {subscriptions.length === 0 ? (
            <p style={{ color: '#71717a', fontSize: '12px', padding: '6px' }}>Non segui ancora nessun canale</p>
          ) : (
            subscriptions.map((ch) => {
              const isSelected = selectedChannel?.username === ch.username;
              return (
                <div
                  key={ch.streamer_id}
                  className={`channel-item ${isSelected ? 'active-channel' : ''}`}
                  onClick={() => onSelectChannel(ch)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#efeff1' }}>{ch.username}</div>
                    {ch.is_live ? (
                      <div style={{ color: '#e91916', fontSize: '11px', fontWeight: 700 }}>● IN ONDA</div>
                    ) : (
                      <div style={{ color: '#71717a', fontSize: '11px' }}>Offline</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <hr className="sidebar-divider" />

      <div className="sidebar-block">
        <div className="sidebar-title">👥 Esplora Tutti gli Utenti</div>
        <div className="scrollable-list">
          {allUsers.length === 0 ? (
            <p style={{ color: '#71717a', fontSize: '12px', padding: '6px' }}>Nessun utente trovato</p>
          ) : (
            allUsers.map((u) => {
              // RIMOSSO IL CONTROLLO CHE NASCONDEVA L'UTENTE CORRENTE
              const isMe = u.id === currentUser?.id;
              const isFollowing = followedIds.has(u.id);
              const isSelected = selectedChannel?.username === u.username;
              const isUserLive = u.is_live === 1 || u.is_live === true;

              return (
                <div
                  key={u.id}
                  className={`user-item ${isSelected ? 'active-channel' : ''}`}
                  onClick={() => onSelectChannel(u)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '6px 8px', 
                    cursor: 'pointer' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      style={{ 
                        fontSize: '10px', 
                        color: isUserLive ? '#00f593' : '#71717a',
                        textShadow: isUserLive ? '0 0 6px #00f593' : 'none'
                      }}
                      title={isUserLive ? 'Live in corso' : 'Offline'}
                    >
                      ●
                    </span>
                    <div>
                      <strong style={{ color: '#efeff1', fontSize: '13px' }}>
                        {u.username} {isMe && <span style={{ color: '#bf94ff', fontSize: '11px' }}>(Tu)</span>}
                      </strong>
                      <div style={{ fontSize: '10px', color: '#71717a' }}>
                        {isUserLive ? 'In onda' : 'Offline'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mostra il pulsante follow solo se NON sei tu */}
                  {!isMe && (
                    <button
                      className="secondary"
                      style={{ 
                        fontSize: '12px', 
                        padding: '3px 10px', 
                        height: 'auto',
                        backgroundColor: isFollowing ? '#27272a' : '#bf94ff',
                        color: isFollowing ? '#efeff1' : '#000000',
                        fontWeight: 600,
                        border: 'none'
                      }}
                      onClick={(e) => handleToggleFollow(e, u.id, isFollowing)}
                      title={isFollowing ? 'Clicca per disiscriverti' : 'Clicca per iscriverti'}
                    >
                      {isFollowing ? '✓ Seguito' : '+ Segui'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}