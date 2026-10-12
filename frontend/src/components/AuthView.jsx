import { useState } from 'react';

export default function AuthView({ onLoginSuccess }) {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [feedback, setFeedback] = useState({ text: '', isError: false });

  async function handleLogin() {
    if (!loginUsername || !loginPassword) {
      setFeedback({ text: 'Inserisci username e password per accedere.', isError: true });
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ text: data.error || data.message || 'Credenziali non valide', isError: true });
        return;
      }

      // ACCESSO DIRETTO ALLA RISPOSTA PIATTA
      const loggedUser = data.user || { username: loginUsername, ...data };
      onLoginSuccess(loggedUser);
    } catch (err) {
      setFeedback({ text: 'Impossibile contattare il server backend.', isError: true });
    }
  }

  async function handleRegister() {
    if (!regUsername || !regFirstName || !regLastName || !regEmail || !regPassword) {
      setFeedback({ text: 'Compila tutti i campi per registrarti.', isError: true });
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: regUsername,
          first_name: regFirstName,
          last_name: regLastName,
          email: regEmail,
          password: regPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ text: data.error || data.message || 'Errore durante la registrazione', isError: true });
        return;
      }

      setFeedback({ text: 'Registrazione completata! Ora puoi effettuare il login a sinistra.', isError: false });
      setLoginUsername(regUsername);
      setRegUsername('');
      setRegFirstName('');
      setRegLastName('');
      setRegEmail('');
      setRegPassword('');
    } catch (err) {
      setFeedback({ text: 'Impossibile contattare il server backend.', isError: true });
    }
  }

  return (
    <div className="guest-wrapper">
      <div className="guest-container">
        <h2 style={{ marginBottom: '15px', color: '#bf94ff' }}>Accedi o Registrati</h2>

        {feedback.text && (
          <div className={`feedback-banner ${feedback.isError ? 'error' : 'success'}`}>
            {feedback.text}
          </div>
        )}

        <div className="auth-grid">
          <div className="auth-card">
            <h3>Login</h3>
            <input
              type="text"
              placeholder="Username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button onClick={handleLogin}>Accedi</button>
          </div>

          <div className="auth-card">
            <h3>Registrazione</h3>
            <input
              type="text"
              placeholder="Username"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
            />
            <input
              type="text"
              placeholder="Nome"
              value={regFirstName}
              onChange={(e) => setRegFirstName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Cognome"
              value={regLastName}
              onChange={(e) => setRegLastName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            />
            <button onClick={handleRegister}>Registrati</button>
          </div>
        </div>
      </div>
    </div>
  );
}