import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  
  const [activeTab, setActiveTab] = useState('dashboard');

  
  const [data, setData] = useState({ storeName: null, averageRating: 0, ratings: [] });
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
      if (user.role !== 'STORE_OWNER') {
        navigate('/');
        return;
      }
      setToken(tokenVal);
      setCurrentUser(user);
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchOwnerDashboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/owner/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (err) {
      console.error('Fetch owner stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerDashboard();
  }, [token]);

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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 text-slate-800 flex flex-col justify-between select-none z-30 overflow-y-auto">
        <div>
          <div className="px-6 py-6 flex items-center space-x-3 border-b border-slate-100">
            <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-base">⭐</span>
            </div>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">RatingApp</span>
            <span className="border border-slate-200 text-slate-500 text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase">
              Owner
            </span>
          </div>

          <nav className="mt-6 px-4 space-y-6">
            <div className="space-y-1.5">
              <div className="px-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                Main Menu
              </div>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'dashboard' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-650'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                  </svg>
                  <span>Dashboard</span>
                </div>
                {activeTab === 'dashboard' && <span className="text-xs">➔</span>}
              </button>

              <button
                onClick={() => setActiveTab('ratings')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'ratings' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-650'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.242.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.178 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 12.08c-.772-.568-.372-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span>Ratings Table</span>
                </div>
                {activeTab === 'ratings' && <span className="text-xs">➔</span>}
              </button>

              <button
                onClick={() => setActiveTab('store-info')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'store-info' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-655'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>My Store Info</span>
                </div>
                {activeTab === 'store-info' && <span className="text-xs">➔</span>}
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="px-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                User
              </div>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'profile' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-655'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>My Profile</span>
                </div>
                {activeTab === 'profile' && <span className="text-xs">➔</span>}
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'settings' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-655'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </div>
                {activeTab === 'settings' && <span className="text-xs">➔</span>}
              </button>
            </div>
          </nav>
        </div>

        <div className="p-5 select-none border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
          © 2026 RatingApp
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <header className="h-16 bg-white border-b border-slate-100 select-none shrink-0">
          <div className="max-w-7xl w-full mx-auto px-10 flex items-center justify-between h-full">
            <div className="flex-1 text-sm font-semibold text-slate-700">
              Welcome back, <span className="font-bold text-slate-900">{currentUser ? currentUser.name : 'Store Owner'}</span>!
            </div>

            <div className="flex items-center space-x-6 text-sm text-slate-700">
              <div className="flex items-center space-x-3">
                <div className="relative h-9 w-9 rounded-full bg-slate-100 border border-slate-205 flex items-center justify-center font-bold text-slate-800 text-sm select-none shadow-sm">
                  {(currentUser ? currentUser.name : 'O').charAt(0)}
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white"></span>
                </div>
              </div>

              <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
                <button
                  onClick={() => setChangePasswordOpen(true)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs transition font-bold"
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

        <main className="flex-1 p-10 space-y-8 max-w-7xl w-full mx-auto">
          
          {loading && !data.storeName ? (
            <div className="text-center py-20 text-slate-550 font-bold">Loading dashboard data...</div>
          ) : !data.storeName ? (
            <div className="bg-white border border-slate-200/50 rounded-xl p-6 max-w-sm mx-auto text-center shadow-sm">
              <h3 className="text-sm font-bold text-black mb-1">No Store Assigned</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your store owner account has no store assigned yet. Please contact the administrator to assign your store.
              </p>
            </div>
          ) : (
            <>
              
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center flex-wrap gap-4 select-none">
                    <div>
                      <h1 className="text-2xl font-extrabold text-black tracking-tight">{data.storeName}</h1>
                      <p className="text-sm text-slate-550 mt-1">Assigned outlet metrics and score statistics</p>
                    </div>
                  </div>

                  {/* Metrics 2-Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                    {/* Average Rating Card */}
                    <div className="bg-white border border-slate-200/50 rounded-xl p-5 flex items-center space-x-4 shadow-sm select-none">
                      <span className="text-3xl text-amber-500">★</span>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Average Rating</div>
                        <div className="text-2xl font-extrabold text-black mt-0.5">
                          {data.averageRating.toFixed(1)} <span className="text-sm text-slate-500 font-medium">/ 5</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Based on {data.ratings.length} reviews</div>
                      </div>
                    </div>

                    {/* Total Feedbacks Card */}
                    <div className="bg-white border border-slate-200/50 rounded-xl p-5 flex items-center space-x-4 shadow-sm select-none">
                      <span className="text-3xl text-blue-500">💬</span>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Feedbacks</div>
                        <div className="text-2xl font-extrabold text-black mt-0.5">
                          {data.ratings.length} <span className="text-sm font-medium text-slate-500">reviews</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">All-time reviews logged</div>
                      </div>
                    </div>
                  </div>

                  
                  <div className="bg-white border border-slate-200/50 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                      <h3 className="text-base font-bold text-black">Recent Customer Ratings</h3>
                      <button onClick={() => setActiveTab('ratings')} className="text-sm font-bold text-black hover:underline">View All</button>
                    </div>
                    {data.ratings.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 font-medium text-sm">No ratings submitted for your store yet.</div>
                    ) : (
                      <div className="space-y-4">
                        {data.ratings.slice(0, 3).map((r, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-black text-sm">{r.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{r.email}</div>
                            </div>
                            <span className="font-extrabold text-amber-500 text-base">★ {r.rating}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              
              {activeTab === 'ratings' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-lg font-bold text-black tracking-tight">Customer Feedbacks</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Complete reviews registry for your store</p>
                  </div>

                  <div className="bg-white border border-slate-200/50 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-655">
                        <thead className="bg-[#f7faf8] border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-3">Customer Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Address</th>
                            <th className="px-6 py-3">Rating Given</th>
                            <th className="px-6 py-3 text-right">Submitted Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.ratings.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-6 py-8 text-center text-slate-450 font-medium">
                                No customer ratings logged yet.
                              </td>
                            </tr>
                          ) : (
                            data.ratings.map((r, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-3 font-bold text-black">{r.name}</td>
                                <td className="px-6 py-3">{r.email}</td>
                                <td className="px-6 py-3 max-w-xs truncate">{r.address}</td>
                                <td className="px-6 py-3 font-bold text-amber-500">★ {r.rating} <span className="text-slate-350 text-[11px] font-normal">/ 5</span></td>
                                <td className="px-6 py-3 text-right text-xs text-slate-400">{formatDate(r.createdAt)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              
              {activeTab === 'store-info' && (
                <div className="bg-white border border-slate-200/50 rounded-xl p-6 max-w-xl mx-auto shadow-sm space-y-5">
                  <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-slate-800 text-lg shadow-inner select-none">
                      🏪
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-black tracking-tight">Assigned Outlet Profile</h3>
                      <p className="text-xs text-slate-400">Registered store coordinates in the database</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Store Name</span>
                      <span className="text-sm font-bold text-black">{data.storeName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Store Email Contact</span>
                      <span className="text-xs font-semibold text-slate-700">store-contact@ratestore.com</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Store Physical Address</span>
                      <span className="text-xs text-slate-600 leading-relaxed">Refer to admin for updates</span>
                    </div>
                  </div>
                </div>
              )}

              
              {activeTab === 'profile' && (
                <div className="bg-white border border-slate-200/50 rounded-xl p-6 max-w-xl mx-auto shadow-sm space-y-5">
                  <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-slate-800 text-base shadow-inner select-none">
                      {(currentUser ? currentUser.name : 'O').charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-black tracking-tight">Owner Account Profile</h3>
                      <p className="text-xs text-slate-400">Your store owner account authorization details</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Full Name</span>
                      <span className="text-sm font-bold text-black">{currentUser ? currentUser.name : 'Store Owner'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Email Address</span>
                      <span className="text-xs font-semibold text-slate-700">{currentUser ? currentUser.email : 'owner@ratestore.com'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Home Address</span>
                      <span className="text-xs text-slate-600 leading-relaxed">{currentUser ? currentUser.address : 'Not Configured'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider font-semibold">Account Role Privilege</span>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-50 text-slate-700 border border-slate-200/60">
                        Store Owner
                      </span>
                    </div>
                  </div>
                </div>
              )}

              
              {activeTab === 'settings' && (
                <div className="bg-white border border-slate-200/50 rounded-xl p-6 max-w-md mx-auto shadow-sm">
                  <h3 className="text-sm font-bold text-black border-b border-slate-100 pb-3 mb-6">Security Settings</h3>
                  
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
                          className="w-full border border-slate-205 rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 bg-slate-50/50"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 text-slate-455 hover:text-slate-600 focus:outline-none transition"
                        >
                          {showOldPassword ? '👁' : '👁‍🗨'}
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
                          className="w-full border border-slate-205 rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 bg-slate-50/50"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 text-slate-455 hover:text-slate-650 focus:outline-none transition"
                        >
                          {showNewPassword ? '👁' : '👁‍🗨'}
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
                          className="w-full border border-slate-205 rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 bg-slate-50/50"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 text-slate-455 hover:text-slate-650 focus:outline-none transition"
                        >
                          {showConfirmPassword ? '👁' : '👁‍🗨'}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full bg-black hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg py-2.5 text-xs font-bold transition shadow-sm"
                      >
                        {passwordLoading ? 'Saving Password...' : 'Save New Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
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
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-605 focus:outline-none transition-colors"
                  >
                    {showOldPassword ? '👁' : '👁‍🗨'}
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
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-slate-450 hover:text-slate-655 focus:outline-none transition-colors"
                  >
                    {showNewPassword ? '👁' : '👁‍🗨'}
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
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-slate-455 hover:text-slate-655 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? '👁' : '👁‍🗨'}
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
                  className="flex-1 bg-black hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-xs font-semibold transition shadow-sm"
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
