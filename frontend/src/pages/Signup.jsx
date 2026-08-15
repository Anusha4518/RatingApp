import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) navigate('/');
  }, [navigate]);

  
  useEffect(() => {
    const newErrors = {};

    if (name.length > 0) {
      if (name.length < 10 || name.length > 60) {
        newErrors.name = 'Name must be 10-60 characters.';
      }
    }

    if (address.length > 0) {
      if (address.length < 10 || address.length > 400) {
        newErrors.address = 'Address must be between 10 and 400 characters.';
      }
    }

    if (password.length > 0) {
      const pwdErrors = [];
      if (password.length < 8 || password.length > 16) {
        pwdErrors.push('8-16 chars');
      }
      if (!/[A-Z]/.test(password)) {
        pwdErrors.push('1 uppercase');
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        pwdErrors.push('1 special char');
      }
      if (pwdErrors.length > 0) {
        newErrors.password = `Must include: ${pwdErrors.join(', ')}.`;
      }
    }

    if (email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Invalid email address format.';
      }
    }

    setErrors(newErrors);
  }, [name, email, address, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    if (Object.keys(errors).length > 0) {
      setFormError('Please fix errors first.');
      return;
    }
    if (name.length < 10 || name.length > 60) {
      setFormError('Name must be 10-60 characters.');
      return;
    }
    if (address.length < 10 || address.length > 400) {
      setFormError('Address must be between 10 and 400 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, address, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Registration failed.');
      } else {
        setSuccess('Registration successful! Redirecting...');
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      }
    } catch (err) {
      setFormError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-slate-50 to-slate-100/80 px-4 py-8">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
        <h2 className="text-center text-2xl font-extrabold text-slate-900 tracking-tight mb-1.5">Create Account</h2>
        <p className="text-center text-xs text-slate-500 mb-6">Create a free account to browse & rate stores</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="bg-red-50 text-red-600 text-xs border border-red-200/60 p-3 rounded-lg font-medium">{formError}</div>}
          {success && <div className="bg-green-50 text-green-600 text-xs border border-green-200/60 p-3 rounded-lg font-medium">{success}</div>}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Name (Min 10 chars)</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 bg-slate-50/50"
              placeholder="Minimum 10 characters..."
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-1">
              <span className="text-red-500">{errors.name}</span>
              <span>{name.length}/60</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 bg-slate-50/50"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-[10px] text-red-500 mt-1 px-1">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Address (Min 10 chars, Max 400)</label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 bg-slate-50/50 resize-none"
              placeholder="Street name, City, ZIP code..."
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-1">
              <span className="text-red-500">{errors.address}</span>
              <span>{address.length}/400</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Password</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 bg-slate-50/50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-650 focus:outline-none transition-colors"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-[10px] text-red-500 mt-1 px-1">{errors.password}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow duration-150"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <p className="text-center text-xs text-slate-600 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors">Sign in here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
