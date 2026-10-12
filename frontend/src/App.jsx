import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthView from './components/AuthView';
import StreamerInfoBar from './components/StreamerInfoBar';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import ChatBox from './components/ChatBox';

export default function App() {
  const [user, setUser] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // RIPRISTINO SESSIONE AL REFRESH (F5) TRAMITE /api/auth/me
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null); // ACCESSO DIRETTO
        }
      } catch (err) {
        console.error('Nessuna sessione attiva');
      } finally {
        setLoadingSession(false);
      }
    }
    checkSession();
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {}
    setUser(null);
    setSelectedChannel(null);
  }

  function handleKeyRegenerated(newKey) {
    setUser((prev) => ({ ...prev, stream_key: newKey }));
  }

  if (loadingSession) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '20vh' }}>Caricamento sessione in corso...</div>;
  }

  return (
    <>
      <Header user={user} onLogout={handleLogout} />

      {!user ? (
        <AuthView onLoginSuccess={(loggedUser) => setUser(loggedUser)} />
      ) : (
        <>
          <StreamerInfoBar user={user} onKeyRegenerated={handleKeyRegenerated} />

          <div className="main-layout">
            <Sidebar
              selectedChannel={selectedChannel}
              onSelectChannel={(channel) => setSelectedChannel(channel)}
              currentUser={user}
            />

            <div className="center-content">
              <VideoPlayer channel={selectedChannel} />
              <ChatBox channel={selectedChannel} user={user} />
            </div>
          </div>
        </>
      )}

      <Footer />
    </>
  );
}