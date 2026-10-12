import { useState, useEffect, useRef } from 'react';

export default function ChatBox({ channel, user }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [chatNotice, setChatNotice] = useState(''); // Stato per il messaggio di avviso
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!channel) return;

    setMessages([]);
    setChatNotice('');

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat?room=${channel.username}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'system' && msg.history) {
          setMessages(msg.history);
        } else if (msg.type === 'chat_message') {
          setMessages((prev) => [...prev, msg]);
        }
      } catch (err) {
        console.error('Errore parsing messaggio chat', err);
      }
    };

    // INTERCETTA LA CHIUSURA DEL WEBSOCKET (es. Codice 1008: Canale Offline)
    ws.onclose = (event) => {
      if (event.code === 1008 || !event.wasClean) {
        setChatNotice('⚠️ Live non iniziata o canale offline. Impossibile connettersi alla chat.');
      }
    };

    return () => {
      ws.close();
    };
  }, [channel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage() {
    if (!inputText.trim()) return;

    // CONTROLLO STATO WEBSOCKET
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setChatNotice('⚠️ Live non iniziata! Impossibile inviare messaggi.');
      return;
    }

    const newMsg = { text: inputText };
    wsRef.current.send(JSON.stringify(newMsg));
    setInputText('');
    setChatNotice(''); // Pulisce eventuali avvisi precedenti se l'invio riesce
  }

  if (!channel) return null;

  return (
    <div className="chat-section">
      <div className="chat-header">
        Chat della community (<span style={{ color: '#bf94ff' }}>#{channel.username}</span>)
      </div>
      
      {/* BANNER DI AVVISO CHAT */}
      {chatNotice && (
        <div style={{
          backgroundColor: '#3f1515',
          color: '#f87171',
          padding: '8px 10px',
          fontSize: '12px',
          textAlign: 'center',
          borderBottom: '1px solid #7f1d1d',
          fontWeight: 600
        }}>
          {chatNotice}
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 ? (
          <em style={{ color: '#71717a', textAlign: 'center', marginTop: '20px', display: 'block' }}>
            {chatNotice ? 'Chat non disponibile.' : 'Benvenuto nella chatroom! Scrivi qualcosa...'}
          </em>
        ) : (
          messages.map((m, index) => (
            <div key={index} style={{ marginBottom: '6px' }}>
              <b style={{ color: m.user === channel.username ? '#e91916' : '#bf94ff' }}>
                {m.user || m.username}:
              </b> {m.text}
            </div>
          ))
        )}
        <div ref= {messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={chatNotice ? "Chat disabilitata (Offline)" : "Invia un messaggio..."}
          maxLength="300"
          style={{ margin: 0 }}
        />
        <button onClick={sendMessage} style={{ width: '75px', margin: 0 }}>Invia</button>
      </div>
    </div>
  );
}