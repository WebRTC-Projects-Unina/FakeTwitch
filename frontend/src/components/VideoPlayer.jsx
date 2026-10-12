import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ channel }) {
  const videoRef = useRef(null);

  const [level, setLevel] = useState('-');

  

  const [stats, setStats] = useState({
    uptime: '00:00:00',
    resolution: '-',
    latency: '0.00 s',
    frames: '0 / 0',
    isActive: false
  });

  // Tracciamo se lo stream era partito e poi è caduto, oppure non è mai iniziato
  const [streamState, setStreamState] = useState('loading'); // 'loading' | 'live' | 'ended' | 'offline'

  useEffect(() => {
    if (!channel || !channel.username || !videoRef.current) return;

    // Controllo preliminare: se il canale non è live secondo il DB/Sidebar
    const isChannelLive = channel.is_live === 1 || channel.is_live === true;
    if (!isChannelLive) {
      setStreamState('offline');
      return;
    }

    setStreamState('loading');
    const streamUrl = `http://${window.location.hostname}:3333/app/${channel.username}/master.m3u8`;
    const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
    
    hls.loadSource(streamUrl);
    hls.attachMedia(videoRef.current);

    // dentro l'useEffect di hls, dopo hls.attachMedia(...)
    hls.on(Hls.Events.LEVEL_SWITCHED, (e, data) => {
      const l = hls.levels[data.level];
      setLevel(`${l.height}p`);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setStreamState('live');
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn('Streaming terminato dal server.');
            // Se fallisce la rete, distinguiamo se non era mai partito o se è caduto
            setStreamState(prev => (prev === 'live' ? 'ended' : 'offline'));
            setStats(prev => ({ ...prev, isActive: false }));
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            break;
        }
      }
    });

    return () => {
      hls.destroy();
    };
  }, [channel]);

  useEffect(() => {
    if (!channel || !videoRef.current || streamState !== 'live') return;

    let streamStartTime = Date.now();

    const timer = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.readyState < 2) {
        setStats(prev => ({ ...prev, isActive: false }));
        return;
      }

      const elapsed = Math.floor((Date.now() - streamStartTime) / 1000);
      const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');

      let lat = '0.00';
      if (video.buffered.length > 0) {
        const bufferEnd = video.buffered.end(video.buffered.length - 1);
        lat = Math.max(0, bufferEnd - video.currentTime).toFixed(2);
      }

      const q = typeof video.getVideoPlaybackQuality === 'function' ? video.getVideoPlaybackQuality() : {};
      const frames = `${q.totalVideoFrames || 0} / ${q.droppedVideoFrames || 0}`;
      const res = video.videoWidth ? `${video.videoWidth}x${video.videoHeight} (${video.videoHeight}p)` : '-';

      setStats({
        uptime: `${hrs}:${mins}:${s}`,
        resolution: res,
        latency: `${lat} s`,
        frames: frames,
        isActive: true
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [channel, streamState]);

  if (!channel) {
    return (
      <div className="middle-column" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', display: 'flex' }}>
        <p style={{ color: '#adadb8' }}>👈 Seleziona un canale dalla Sidebar per guardare lo stream</p>
      </div>
    );
  }

  return (
    <div className="middle-column">
      <div className="player-section">
        <div className="player-header">
          <h3 style={{ fontSize: '16px', margin: 0 }}>Canale di {channel.username}</h3>
          <span style={{ fontSize: '12px', color: '#bf94ff', backgroundColor: '#2f2f35', padding: '4px 8px', borderRadius: '4px' }}>Auto (ABR): {level}</span>
        </div>
        <div className="video-wrapper" style={{ position: 'relative' }}>
          <video ref={videoRef} controls autoPlay muted playsInline></video>
          
          {/* OVERLAY DINAMICO: Offline (Non ancora avviata) vs Terminata */}
          {streamState === 'offline' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              color: '#fff', zIndex: 10
            }}>
              <h2 style={{ color: '#a1a1aa', marginBottom: '8px' }}>💤 Canale Offline</h2>
              <p style={{ color: '#71717a', fontSize: '14px' }}>La diretta non è ancora stata avviata.</p>
            </div>
          )}

          {streamState === 'ended' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              color: '#fff', zIndex: 10
            }}>
              <h2 style={{ color: '#e91916', marginBottom: '8px' }}>🔴 Diretta Terminata</h2>
              <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Lo streamer ha interrotto la trasmissione.</p>
            </div>
          )}
        </div>
      </div>

      <div className="stats-panel">
        <div className="stats-panel-header">
          <div className="stats-status-wrap">
            <span className={`pulse-dot ${stats.isActive ? 'active' : ''}`}></span>
            <span>
              Stato: {
                streamState === 'offline' ? 'Non ancora avviata' :
                streamState === 'ended' ? 'Terminata' :
                stats.isActive ? 'In Riproduzione' : 'Caricamento flusso...'
              }
            </span>
          </div>
          <span className="protocol-badge">Protocollo: LL-HLS / ABR</span>
        </div>
      </div>
    </div>
  );
}