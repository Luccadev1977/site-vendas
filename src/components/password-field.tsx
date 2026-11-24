'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
export function PasswordField({
  id,
  label,
  name,
  value,
  onChange,
  error,
  newPassword = false,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  newPassword?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-control">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={newPassword ? 'new-password' : 'current-password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          aria-invalid={!!error}
          aria-describedby={error ? id + '-error' : undefined}
          autoCapitalize="none"
          spellCheck={false}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${name === 'confirmation' ? 'confirmação de senha' : 'senha'}`}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
      {error && (
        <span id={id + '-error'} className="error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
