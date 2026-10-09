import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { api, session } from '../api.js';

const field = 'w-full rounded-lg border border-brand/30 px-3 py-2';
const cleanPhone = (v) => {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('254') && d.length > 9) d = d.slice(3);
  return d.replace(/^0/, '').slice(0, 9);
};
const Input = ({ icon: Icon, className = '', ...p }) => (
  <div className="relative">
    <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/50" />
    <input {...p} className={`${field} pl-9 ${className}`} />
  </div>
);
const Google = () => (
  <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h6a5.2 5.2 0 0 1-2.200 3.400v2.800h3.600c2.100-1.900 3.200-4.800 3.200-8.300z" />
    <path fill="#34A853" d="M12 23c3 0 5.500-1 7.300-2.700l-3.600-2.800c-1 .7-2.200 1-3.700 1-2.800 0-5.200-1.900-6.100-4.500H2.200v2.900A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.900 14c-.2-.7-.4-1.300-.4-2s.1-1.400.4-2V7.100H2.200a11 11 0 0 0 0 9.800L5.900 14z" />
    <path fill="#EA4335" d="M12 5.400c1.600 0 3.100.6 4.200 1.600l3.200-3.200A11 11 0 0 0 2.200 7.100L5.900 10c.9-2.600 3.300-4.600 6.100-4.600z" />
  </svg>
);
const Microsoft = () => (
  <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
    <path fill="#F25022" d="M1 1h10v10H1z" /><path fill="#7FBA00" d="M13 1h10v10H13z" />
    <path fill="#00A4EF" d="M1 13h10v10H1z" /><path fill="#FFB900" d="M13 13h10v10H13z" />
  </svg>
);

function PhoneField({ value, onChange }) {
  return (
    <div className="flex rounded-lg border border-brand/30 focus-within:outline-2 focus-within:outline-brand">
      <span className="flex items-center rounded-l-lg border-r border-brand/30 bg-brand-tint px-3 font-semibold text-brand-dark">+254</span>
      <input type="tel" inputMode="numeric" required value={value} onChange={(e) => onChange(cleanPhone(e.target.value))}
        pattern="[17][0-9]{8}" maxLength={16} placeholder="712 345 678" aria-label="Kenyan phone number"
        title="Enter a Kenyan mobile number: 9 digits starting with 7 or 1, e.g. 712345678"
        className="w-full rounded-r-lg px-3 py-2 outline-none" />
    </div>
  );
}

export default function LoginBox({ mode, setMode, onDone }) {
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [by, setBy] = useState('email');
  const [phone, setPhone] = useState('');
  const reg = mode === 'register';
  const Head = reg ? UserPlus : LogIn;

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    const f = Object.fromEntries(new FormData(e.target));
    try {
      const data = reg
        ? await api.register({ ...f, phone_number: `+254${phone}` })
        : await api.login({ identifier: by === 'phone' ? `+254${phone}` : f.identifier, password: f.password });
      session.save(data); onDone(data.user);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} id="auth" className="space-y-4 rounded-2xl border border-brand/15 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-brand-dark"><Head className="size-6" />{reg ? 'Create your account' : 'Welcome back'}</h2>
      {reg ? <>
        <Input icon={User} name="full_name" required placeholder="Full name" />
        <Input icon={Mail} name="email" type="email" required placeholder="Email" />
        <PhoneField value={phone} onChange={setPhone} />
      </> : <>
        <div className="flex gap-2" role="group" aria-label="Log in with">
          {[['email', 'Email'], ['phone', 'Phone number']].map(([k, l]) => (
            <button type="button" key={k} aria-pressed={by === k} onClick={() => setBy(k)}
              className={`flex-1 rounded-lg border py-1.5 text-sm font-semibold ${by === k ? 'border-brand bg-brand text-white' : 'border-brand/30'}`}>{l}</button>
          ))}
        </div>
        {by === 'email'
          ? <Input icon={Mail} name="identifier" type="email" required placeholder="Email" />
          : <PhoneField value={phone} onChange={setPhone} />}
      </>}
      <div className="relative">
        <Input icon={Lock} name="password" required type={show ? 'text' : 'password'} placeholder="Password" className="pr-10" />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/60 hover:text-brand">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {!reg && <div className="flex justify-between text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" className="accent-brand" /> Remember me</label>
        <a href="#" className="text-brand">Forgot password?</a>
      </div>}
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"><Head className="size-4" />{reg ? 'Create Account' : 'Login'}</button>
      <div className="grid gap-2 text-sm font-semibold">
        <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-ink/20 py-2 hover:bg-brand-tint"><Google />Continue with Google</button>
        <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-ink/20 py-2 hover:bg-brand-tint"><Microsoft />Continue with Microsoft</button>
      </div>
      <p className="text-center text-sm">{reg ? 'Already registered?' : 'New here?'}{' '}
        <button type="button" onClick={() => setMode(reg ? 'login' : 'register')} className="font-semibold text-brand underline">{reg ? 'Login' : 'Create Account'}</button></p>
    </form>
  );
}
