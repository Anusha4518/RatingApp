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
      


      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        
        <header className="h-16 bg-white border-b border-slate-200/50 select-none shrink-0">
          <div className="max-w-4xl w-full mx-auto px-8 flex items-center justify-between h-full">
            {/* Logo */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-base">⭐</span>
              </div>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">RatingApp</span>
              <span className="border border-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase">
                User
              </span>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-sm mx-8 flex items-center">
              {activeTab === 'stores' && (
                <div className="relative w-full flex items-center">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search store name or address..."
                    className="w-full bg-[#f3f7f5] border border-transparent rounded-full px-5 py-2 text-xs outline-none transition focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 text-slate-700"
                  />
                  <button className="absolute right-1 hover:bg-slate-200/50 p-1.5 rounded-full text-slate-400 transition">
                    🔍
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 text-sm text-slate-700">
              




              
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

        {/* Horizontal Tab Navigation */}
        <nav className="bg-white border-b border-slate-100 select-none shrink-0">
          <div className="max-w-4xl w-full mx-auto px-8 flex items-center space-x-1 h-11">
            {[
              { key: 'stores',      label: 'Stores' },
              { key: 'ratings',     label: 'My Ratings' },
              { key: 'my-feedback', label: 'My Feedback' },
              { key: 'profile',     label: 'Profile' },
              { key: 'settings',    label: 'Settings' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

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
                <p className="text-sm text-slate-500 mt-0.5">Rate local shops and browse feedback</p>
              </div>

              {loading && stores.length === 0 ? (
                <div className="text-center py-20 text-slate-500 font-semibold">Loading stores...</div>
              ) : stores.length === 0 ? (
                <div className="bg-white border border-slate-200/50 rounded-2xl p-16 text-center shadow-sm">
                  <p className="text-slate-500 font-semibold">No stores found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {stores.map((store) => (
                    <div key={store.id} className="bg-white border border-slate-200/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                      {/* Card Header */}
                      <div className="p-7 flex-1">
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <h3 className="font-extrabold text-slate-900 text-lg leading-snug">{store.name}</h3>
                          <span className="bg-amber-50 border border-amber-200/60 text-amber-600 text-sm px-3 py-1 rounded-full font-extrabold shrink-0 flex items-center gap-1 shadow-sm">
                            ★ {store.averageRating.toFixed(1)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mb-3">{store.email}</p>

                        <div className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <span className="shrink-0 mt-0.5">📍</span>
                          <span>{store.address}</span>
                        </div>

                        {/* Average rating bar */}
                        <div className="mt-5">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Rating</span>
                            <span className="text-xs font-bold text-slate-700">{store.averageRating.toFixed(1)} / 5</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-amber-400 h-1.5 rounded-full transition-all"
                              style={{ width: `${(store.averageRating / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Footer — Rating */}
                      <div className="border-t border-slate-100 px-7 py-5 flex justify-between items-center bg-slate-50/50 rounded-b-2xl">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-2 font-bold uppercase tracking-wider">
                            {store.userRating > 0 ? 'Your Rating' : 'Click to Rate'}
                          </span>
                          <StarRating
                            currentRating={store.userRating}
                            onRate={(newRating) => handleRateStore(store.id, newRating)}
                          />
                        </div>
                        {store.userRating > 0 && (
                          <span className="text-sm text-slate-800 font-bold bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center select-none shadow-sm">
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
