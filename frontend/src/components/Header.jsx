import logoImg from '../assets/logo.png'; // Percorso dell'immagine

export default function Header({ user, onLogout }) {
  return (
    <header className="header-bar" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 20px',
      height: '50px',
      backgroundColor: '#18181b',
      borderBottom: '1px solid #27272a'
    }}>
      {/* Logo con immagine semplice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <img 
          src={logoImg} 
          alt="FakeTwitch Logo" 
          style={{ height: '50px', width: 'auto', objectFit: 'contain' }} 
        />
        <span style={{ 
          fontFamily: 'Inter, sans-serif', 
          fontWeight: 800, 
          fontSize: '18px', 
          letterSpacing: '-0.5px',
          color: '#efeff1' 
        }}>
          Fake<span style={{ color: '#9146FF' }}>Twitch</span>
        </span>
      </div>

      {/* Sezione utente / logout a destra */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {user ? (
          <>
            <span style={{ fontSize: '13px', color: '#a1a1aa' }}>
              Benvenuto, <strong style={{ color: '#efeff1' }}>{user.username}</strong>
            </span>
            <button 
              onClick={onLogout}
              className="secondary"
              style={{ fontSize: '12px', padding: '5px 12px', height: 'auto', backgroundColor: '#27272a', color: '#fff', border: 'none' }}
            >
              Logout
            </button>
          </>
        ) : (
          <span style={{ fontSize: '13px', color: '#71717a' }}>Ospite</span>
        )}
      </div>
    </header>
  );
}