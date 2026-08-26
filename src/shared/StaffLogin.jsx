// src/shared/StaffLogin.jsx
import React, { useState } from 'react';

const SUCURSALES = [
  { value: 'xico', label: 'Xico' },
  { value: 'coatepec', label: 'Coatepec' },
];

const StaffLogin = ({ onLogin, title = 'BenditasClub POS' }) => {
  const [sucursal, setSucursal] = useState('xico');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const presionarDigito = (d) => {
    if (pin.length >= 4) return;
    setPin((prev) => prev + d);
  };

  const borrar = () => setPin((prev) => prev.slice(0, -1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await onLogin(sucursal, pin);
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pos-login">
      <h2>{title}</h2>

      <label className="pos-login-label">
        Sucursal
        <select value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
          {SUCURSALES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>

      <div className="pos-pin-display">{'•'.repeat(pin.length).padEnd(4, '○')}</div>

      <div className="pos-pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'borrar', '0', 'ok'].map((key) => {
          if (key === 'borrar') {
            return <button type="button" key={key} onClick={borrar}>⌫</button>;
          }
          if (key === 'ok') {
            return (
              <button
                type="button"
                key={key}
                className="pos-pin-ok"
                onClick={handleSubmit}
                disabled={pin.length !== 4 || enviando}
              >
                Entrar
              </button>
            );
          }
          return (
            <button type="button" key={key} onClick={() => presionarDigito(key)}>
              {key}
            </button>
          );
        })}
      </div>

      {error && <p className="pos-error">{error}</p>}
    </div>
  );
};

export default StaffLogin;
