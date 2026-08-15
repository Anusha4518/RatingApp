import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  
  const [activeTab, setActiveTab] = useState('stores');

  
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const tokenVal = localStorage.getItem('token');
    if (!userStr || !tokenVal) {
      navigate('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'NORMAL_USER') {
        navigate('/');
        return;
      }
      setToken(tokenVal);
      setCurrentUser(user);
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchStores = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({ search }).toString();
      const res = await fetch(`http://127.0.0.1:5000/api/stores?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      const data = await res.json();
      if (res.ok) setStores(data);
    } catch (err) {
      console.error('Fetch stores error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [token, search]);

  const handleRateStore = async (storeId, newRating) => {
    if (!token) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/stores/${storeId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: newRating })
      });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      if (res.ok) {
        fetchStores();
      }
    } catch (err) {
      console.error('Rating error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('http://127.0.0.1:5000/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
      setPasswordError('Password must be 8-16 characters.');
      return;
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    if (!hasUppercase || !hasSpecial) {
      setPasswordError('Password must include 1 uppercase letter and 1 special character.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || 'Failed to change password.');
      } else {
        setPasswordSuccess('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setChangePasswordOpen(false);
          setPasswordSuccess('');
        }, 1200);
      }
    } catch (err) {
      setPasswordError('Connection error.');
    } finally {
      setPasswordLoading(false);
    }
  };

  function StarRating({ currentRating, onRate }) {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="flex items-center space-x-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none transition transform hover:scale-110"
          >
            <span
              className={`text-2xl leading-none ${
                star <= (hoverRating || currentRating) ? 'text-amber-500' : 'text-slate-200'
              }`}
            >
              ★
            </span>
          </button>
        ))}
      </div>
    );
  }

  
  const ratedStores = stores.filter(s => s.userRating > 0);
  const totalUserRatingsCount = ratedStores.length;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      <aside className="w-64 bg-white border-r border-slate-200 text-slate-800 flex flex-col justify-between shrink-0 select-none">
        <div>
          <div className="px-6 py-6 flex items-center space-x-3.5 border-b border-slate-100">
            <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-base text-slate-800">⭐</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none font-sans">RatingApp</span>
            <span className="border border-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase scale-90">
              User
            </span>
          </div>

          <nav className="mt-6 px-4 space-y-7">
            <div className="space-y-1.5">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'dashboard' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-650'
                }`}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('stores')}
                className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'stores' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-655'
                }`}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Stores</span>
              </button>

              <button
                onClick={() => setActiveTab('ratings')}
                className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'ratings' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-655'
                }`}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 01-2 2" />
                </svg>
                <span>Ratings</span>
              </button>

              <button
                onClick={() => setActiveTab('my-feedback')}
                className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'my-feedback' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-655'
                }`}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>My Feedback</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="px-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Account
              </div>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'profile' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-655'
                }`}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'settings' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-655'
                }`}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Settings</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center">
            <span className="text-3xl mb-2">🛍️</span>
            <div className="text-xs font-bold text-slate-900 mb-0.5">Rate. Discover. Support.</div>
            <div className="text-[10px] text-slate-500 leading-normal">
              Your feedback helps local businesses grow.
            </div>
          </div>
        </div>
      </aside>

      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        
        <header className="h-16 bg-white border-b border-slate-200/50 select-none shrink-0">
          <div className="max-w-4xl w-full mx-auto px-8 flex items-center justify-between h-full">
            <div className="flex-1 max-w-sm flex items-center">
              {activeTab === 'stores' && (
                <div className="relative w-full flex items-center">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search store name or address..."
                    className="w-full bg-[#f3f7f5] border border-transparent rounded-full px-5 py-2 text-xs outline-none transition focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 text-slate-700"
                  />
                  <button className="absolute right-1 hover:bg-slate-200/50 p-1.5 rounded-full text-slate-400 hover:text-slate-650 transition">
                    🔍
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 text-sm text-slate-700">
              
              <div className="flex items-center space-x-2">
                <span>Welcome, </span>
                <span className="font-extrabold text-slate-800">
                  {currentUser ? currentUser.name : 'Vikramaditya Pratap Singh'}
                </span>
              </div>

              
              <div className="relative p-2 hover:bg-[#eaf1ed] rounded-full cursor-pointer transition">
                <svg className="h-5 w-5 text-slate-500 hover:text-slate-750" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-emerald-700 text-white rounded-full text-[8px] font-extrabold flex items-center justify-center">
                  2
                </span>
              </div>

              
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                <button
                  onClick={() => setChangePasswordOpen(true)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-[#deeae3] text-slate-900 rounded-lg text-xs transition font-bold"
                >
                  Change Password
                </button>
                
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs transition font-bold"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        
        <main className="flex-1 p-8 space-y-8 max-w-4xl w-full mx-auto">
          
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Overview Dashboard</h1>
                <p className="text-xs text-slate-500 mt-0.5">Glance at store counts and feedbacks</p>
              </div>

              <section className="grid grid-cols-2 gap-6">
                
                <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Shops Available</div>
                  <div className="text-2xl font-extrabold text-slate-900">{stores.length}</div>
                </div>

                
                <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Shops Rated by You</div>
                  <div className="text-2xl font-extrabold text-slate-900">{totalUserRatingsCount}</div>
                </div>
              </section>

              
              <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Your Recent Ratings</h3>
                {ratedStores.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 font-medium text-xs">You have not submitted any feedbacks yet.</div>
                ) : (
                  <div className="space-y-3">
                    {ratedStores.slice(0, 3).map(s => (
                      <div key={s.id} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900">{s.name}</span>
                        <div className="flex items-center space-x-1 font-bold text-amber-500">
                          <span>★ {s.userRating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          
          {activeTab === 'stores' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Registered Shops</h1>
                <p className="text-xs text-slate-500 mt-0.5">Rate local shops and browse feedback</p>
              </div>

              {loading && stores.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-semibold">Loading stores...</div>
              ) : stores.length === 0 ? (
                <div className="bg-white border border-slate-200/50 rounded-2xl p-12 text-center shadow-sm">
                  <p className="text-slate-500 font-semibold">No stores found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {stores.map((store) => (
                    <div key={store.id} className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <h3 className="font-bold text-slate-900 text-base leading-snug">{store.name}</h3>
                          <span className="bg-amber-50 border border-amber-200/60 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-extrabold shrink-0 flex items-center gap-0.5 shadow-sm">
                            ★ {store.averageRating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-700 font-bold tracking-wider uppercase mb-2">{store.email}</p>
                        <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-1">
                          <span className="text-slate-700">📍</span>
                          <span>{store.address}</span>
                        </p>
                      </div>

                      <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between items-end">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1.5 font-bold uppercase tracking-wider">
                            {store.userRating > 0 ? 'Your Rating' : 'Click to Rate'}
                          </span>
                          <StarRating
                            currentRating={store.userRating}
                            onRate={(newRating) => handleRateStore(store.id, newRating)}
                          />
                        </div>
                        {store.userRating > 0 && (
                          <span className="text-xs text-slate-800 font-bold bg-slate-100 border border-slate-200 rounded-md px-2 py-1 flex items-center select-none">
                            Rated:&nbsp;{store.userRating} / 5
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'ratings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Star Reviews</h1>
                <p className="text-xs text-slate-500 mt-0.5">Detailed average scores for all locations</p>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-655">
                  <thead className="bg-[#f7faf8] border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Store Name</th>
                      <th className="px-6 py-3.5">Location Address</th>
                      <th className="px-6 py-3.5">Rating Score</th>
                      <th className="px-6 py-3.5 text-right font-bold">Your Rated Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stores.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                        <td className="px-6 py-4 max-w-xs truncate">{s.address}</td>
                        <td className="px-6 py-4 font-bold text-amber-500">★ {s.averageRating.toFixed(1)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700">{s.userRating > 0 ? `★ ${s.userRating}` : 'Not Rated'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          
          {activeTab === 'my-feedback' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Rating Feedbacks</h1>
                <p className="text-xs text-slate-500 mt-0.5">Reviews and stars you have submitted</p>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-655">
                  <thead className="bg-[#f7faf8] border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Shop Name</th>
                      <th className="px-6 py-3.5">Shop Email</th>
                      <th className="px-6 py-3.5">Shop Address</th>
                      <th className="px-6 py-3.5 text-right font-bold">Your Review Stars</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ratedStores.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-slate-450 font-medium">You have not rated any shops yet.</td>
                      </tr>
                    ) : (
                      ratedStores.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                          <td className="px-6 py-4 text-slate-800 font-bold uppercase text-xs">{s.email}</td>
                          <td className="px-6 py-4 max-w-xs truncate">{s.address}</td>
                          <td className="px-6 py-4 text-right font-extrabold text-amber-500">★ {s.userRating} / 5</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200/50 rounded-2xl p-8 max-w-xl mx-auto shadow-sm space-y-6">
              <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
                <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xl shadow-inner select-none">
                  {(currentUser ? currentUser.name : 'U').charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Customer Profile</h3>
                  <p className="text-xs text-slate-400">Your account identity details</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Full Name</span>
                  <span className="text-base font-bold text-slate-900">{currentUser ? currentUser.name : 'Vikramaditya Pratap Singh'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Email Address</span>
                  <span className="text-sm font-semibold text-slate-750">{currentUser ? currentUser.email : 'user@ratestore.com'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Home Address</span>
                  <span className="text-sm text-slate-650 leading-relaxed">{currentUser ? currentUser.address : 'Not Configured'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider font-semibold">Account Role Privilege</span>
                  <span className="inline-block mt-1.5 px-3 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-50 text-slate-700 border border-slate-200/60">
                    Normal User
                  </span>
                </div>
              </div>
            </div>
          )}

          
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200/50 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3.5 mb-6">Security Settings</h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && <div className="text-red-655 text-xs font-semibold bg-red-50 border border-red-100 p-2 rounded">{passwordError}</div>}
                {passwordSuccess && <div className="text-green-655 text-xs font-semibold bg-green-50 border border-green-100 p-2 rounded">{passwordSuccess}</div>}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Old Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full border border-slate-205 rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10 bg-slate-50/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 text-slate-450 hover:text-slate-600 focus:outline-none transition"
                    >
                      {showOldPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-205 rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10 bg-slate-50/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-slate-455 hover:text-slate-650 focus:outline-none transition"
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-slate-205 rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10 bg-slate-50/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-slate-455 hover:text-slate-650 focus:outline-none transition"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg py-2.5 text-xs font-bold transition shadow-sm"
                  >
                    {passwordLoading ? 'Saving Password...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      
      {changePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white border border-slate-205 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Change Password</h3>
              <button onClick={() => setChangePasswordOpen(false)} className="text-slate-400 hover:text-slate-655 font-bold transition-colors">✕</button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              {passwordError && <div className="text-red-655 text-xs font-semibold bg-red-50 border border-red-100 p-2 rounded">{passwordError}</div>}
              {passwordSuccess && <div className="text-green-655 text-xs font-semibold bg-green-50 border border-green-100 p-2 rounded">{passwordSuccess}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Old Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showOldPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-slate-450 hover:text-slate-650 focus:outline-none transition-colors"
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-slate-450 hover:text-slate-655 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  className="flex-1 border border-slate-200 rounded-lg text-slate-700 px-3 py-2 hover:bg-slate-50 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-emerald-700 hover:bg-slate-100 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-xs font-semibold transition shadow-sm"
                >
                  {passwordLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
