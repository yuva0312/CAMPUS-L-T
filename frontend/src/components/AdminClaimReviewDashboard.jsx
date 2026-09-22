import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  User, 
  Package, 
  FileText,
  AlertCircle,
  LayoutDashboard,
  ClipboardList,
  SearchAlert,
  Boxes,
  Cpu,
  LogOut,
  X,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to safely render strings without throwing React child object errors
const safeString = (val, fallback = 'N/A') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.name || val.title || val.fullName || val.label || fallback;
  }
  return fallback;
};

export default function AdminClaimReviewDashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Rejection modal state
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    claimId: null,
    reason: ''
  });

  const getClaimId = (claim) => safeString(claim?._id || claim?.id, '');

  const getClaimantName = (claim) => {
    const c = claim?.claimantName || claim?.user;
    if (typeof c === 'object' && c !== null) {
      return safeString(c.fullName || c.name);
    }
    return safeString(c);
  };

  const isPendingStatus = (status) => {
    const s = String(status || '').toUpperCase();
    return s === 'PENDING' || s === 'PENDING REVIEW';
  };

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await api.get('/admin/claims');
      } catch (err) {
        if (err.response?.status === 404) {
          res = await api.get('/claims');
        } else {
          throw err;
        }
      }

      const claimsData = Array.isArray(res.data)
        ? res.data
        : res.data?.claims || res.data?.data || [];

      setClaims(claimsData);
    } catch (err) {
      console.error('Failed to fetch claims:', err);
      setError(err.response?.data?.message || 'Failed to load claims. Check your backend server.');
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleApprove = async (claimId) => {
    setProcessingId(claimId);
    try {
      await api.patch(`/admin/claims/${claimId}/approve`);
      setClaims((prev) =>
        prev.map((c) => (getClaimId(c) === claimId ? { ...c, status: 'APPROVED' } : c))
      );
      setNotification({
        type: 'success',
        message: `Claim ${claimId} APPROVED and marked available for future matches.`
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to approve claim.'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (claimId) => {
    setRejectionModal({
      isOpen: true,
      claimId,
      reason: 'Verification details do not match found item specs.'
    });
  };

  const handleRejectSubmit = async () => {
    const { claimId, reason } = rejectionModal;
    if (!claimId) return;

    setProcessingId(claimId);
    try {
      await api.patch(`/admin/claims/${claimId}/reject`, { reason });
      setClaims((prev) =>
        prev.map((c) => (getClaimId(c) === claimId ? { ...c, status: 'REJECTED' } : c))
      );
      setNotification({
        type: 'success',
        message: `Claim ${claimId} REJECTED and marked available for future matches.`
      });
      setRejectionModal({ isOpen: false, claimId: null, reason: '' });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reject claim.'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredClaims = useMemo(() => {
    if (!Array.isArray(claims)) return [];
    const query = searchTerm.toLowerCase().trim();

    return claims.filter((claim) => {
      const currentStatus = String(claim.status || 'PENDING').toUpperCase();
      
      let matchesStatus = false;
      if (statusFilter === 'ALL') {
        matchesStatus = true;
      } else if (statusFilter === 'PENDING') {
        matchesStatus = isPendingStatus(currentStatus);
      } else {
        matchesStatus = currentStatus === statusFilter;
      }

      if (!matchesStatus) return false;
      if (!query) return true;

      const claimId = getClaimId(claim).toLowerCase();
      const name = getClaimantName(claim).toLowerCase();
      const email = safeString(claim.claimantEmail || claim.claimantName?.email || claim.user?.email).toLowerCase();
      const itemTitle = safeString(claim.title || claim.itemTitle || claim.foundItem?.title).toLowerCase();

      return claimId.includes(query) || name.includes(query) || email.includes(query) || itemTitle.includes(query);
    });
  }, [claims, statusFilter, searchTerm]);

  const metrics = useMemo(() => ({
    total: claims.length,
    pending: claims.filter((c) => isPendingStatus(c.status)).length,
    approved: claims.filter((c) => String(c.status || '').toUpperCase() === 'APPROVED').length,
    recovered: claims.filter((c) => String(c.status || '').toUpperCase() === 'RECOVERED').length,
    rejected: claims.filter((c) => String(c.status || '').toUpperCase() === 'REJECTED').length,
  }), [claims]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 font-sans flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800/80 bg-[#0c101c] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-pink-600/30">
            S
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide">Student Care Team Portal</h1>
            <p className="text-[9px] text-pink-400 font-bold tracking-wider uppercase">STUDENT CARE & GOVERNANCE CONTROL</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">Lost & Found Team Admin</p>
            <p className="text-[10px] text-slate-400">admin@campus.edu</p>
          </div>
          <button type="button" className="px-3.5 py-1.5 text-xs font-semibold bg-pink-950/40 hover:bg-pink-900/60 text-pink-400 border border-pink-800/40 rounded-lg transition flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Body Layout with Sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar Menu */}
        <aside className="w-60 bg-[#0a0d16] border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
          <div className="space-y-6">
            <nav className="space-y-1.5 pt-2">
              <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-[#1e152d] text-purple-300 border border-purple-500/30 shadow-md">
                <ClipboardList className="w-4 h-4 text-purple-400" /> Claims Review
              </button>
              <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition">
                <SearchAlert className="w-4 h-4" /> Lost Reports
              </button>
              <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition">
                <Boxes className="w-4 h-4" /> Found Inventory
              </button>
              <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition">
                <Cpu className="w-4 h-4" /> AI Match Intelligence
              </button>
            </nav>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Main Title Banner */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">SC Verification Portal</h1>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Cross-evaluate student submitted Student Care verification answers against unredacted inventory records. Approve verified claims and mark handed-over items as Recovered.
            </p>
          </div>

          {/* Metric Status Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            <div className="bg-[#0b0f19] border border-red-900/30 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">PENDING</p>
              <p className="text-2xl font-bold text-white mt-0.5">{metrics.pending}</p>
            </div>
            <div className="bg-[#0b0f19] border border-emerald-900/30 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">APPROVED</p>
              <p className="text-2xl font-bold text-white mt-0.5">{metrics.approved}</p>
            </div>
            <div className="bg-[#0b0f19] border border-cyan-900/30 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">RECOVERED</p>
              <p className="text-2xl font-bold text-white mt-0.5">{metrics.recovered}</p>
            </div>
            <div className="bg-[#0b0f19] border border-rose-900/30 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">REJECTED</p>
              <p className="text-2xl font-bold text-white mt-0.5">{metrics.rejected}</p>
            </div>
          </div>

          {/* Green Alert Banner matching original UI */}
          {notification && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span>{notification.message}</span>
              </div>
              <button type="button" onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filters Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0a0d16] p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === 'ALL'
                    ? 'bg-purple-900/40 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Claims ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === 'PENDING'
                    ? 'bg-purple-900/40 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending Review ({metrics.pending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === 'APPROVED'
                    ? 'bg-purple-900/40 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Approved ({metrics.approved})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('RECOVERED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === 'RECOVERED'
                    ? 'bg-purple-900/40 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Recovered ({metrics.recovered})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === 'REJECTED'
                    ? 'bg-purple-900/40 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rejected ({metrics.rejected})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search claimant, ID, or item"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#07090e] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <button
                type="button"
                onClick={fetchClaims}
                disabled={loading}
                className="px-3 py-1.5 bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          {/* Cards Display */}
          {loading ? (
            <div className="text-center py-20 bg-[#0a0d16] rounded-2xl border border-slate-800/80">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading claims data...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="text-center py-20 bg-[#0a0d16] rounded-2xl border border-slate-800/80">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">No claims match your filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClaims.map((claim) => {
                const claimId = getClaimId(claim);
                const status = String(claim.status || 'PENDING').toUpperCase();
                const isPending = isPendingStatus(status);
                const confidence = safeString(claim.confidenceScore ?? claim.verificationConfidence, '66');

                const claimantNameStr = getClaimantName(claim);
                const studentObj = typeof claim.claimantName === 'object' && claim.claimantName !== null 
                  ? claim.claimantName 
                  : (typeof claim.user === 'object' && claim.user !== null ? claim.user : {});

                const studentIdStr = safeString(claim.studentId || studentObj.studentId, 'YU031205');
                const emailStr = safeString(claim.claimantEmail || studentObj.email, 'yuva@college.edu');
                const phoneStr = safeString(claim.phone || studentObj.phone, '9876543210');
                const deptStr = safeString(claim.department || studentObj.department, 'Artificial Intelligence & Machine Learning');
                const yearStr = safeString(claim.year || studentObj.year, '4th Year (Senior)');

                return (
                  <div key={claimId} className="bg-[#0b0e18] border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl relative">
                    {/* Top Row: REF, Date & Status Badges */}
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-purple-400">
                          CLAIM REF: <span className="text-purple-300 font-semibold">{claimId}</span>
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          📅 {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Aug 25, 2026, 10:51 PM'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="bg-[#140e21] border border-purple-500/30 rounded-lg px-3 py-1 text-center">
                          <p className="text-[8px] text-purple-400 font-bold uppercase tracking-wider">VERIFICATION CONFIDENCE</p>
                          <p className="text-sm font-black text-purple-300">{confidence}%</p>
                        </div>

                        {status === 'APPROVED' ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            • APPROVED
                          </span>
                        ) : status === 'REJECTED' ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            • REJECTED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            • PENDING
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Claimant Name */}
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Claimant: {claimantNameStr} <span className="text-xs font-normal text-slate-400">({studentIdStr})</span>
                      </h2>
                    </div>

                    {/* 3 Grid Panels */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 1. Student Profile */}
                      <div className="bg-[#070a12] p-4 rounded-xl border border-slate-800/60 space-y-2 text-xs">
                        <p className="text-[11px] font-bold text-purple-400 flex items-center gap-1 mb-2">
                          <User className="w-3.5 h-3.5" /> Student Profile
                        </p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Full Name:</span> {claimantNameStr}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Student ID:</span> {studentIdStr}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Email:</span> {emailStr}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Phone:</span> {phoneStr}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Dept & Year:</span> {deptStr} ({yearStr})</p>
                      </div>

                      {/* 2. Found Inventory Record (Private Spec) */}
                      <div className="bg-[#070a12] p-4 rounded-xl border border-slate-800/60 space-y-2 text-xs">
                        <p className="text-[11px] font-bold text-pink-400 flex items-center gap-1 mb-2">
                          <Package className="w-3.5 h-3.5" /> Found Inventory Record (Private Spec)
                        </p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Item Name:</span> {safeString(claim.title || claim.itemTitle || claim.foundItem?.title, 'MAC LAPTOP')}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Category:</span> {safeString(claim.foundItem?.category, 'Laptop')}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Actual Brand:</span> <span className="text-rose-400 font-semibold">{safeString(claim.actualBrand || claim.foundItem?.brand, 'APPLE')}</span></p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Actual Colour:</span> <span className="text-slate-400">{safeString(claim.actualColour || claim.foundItem?.colour, 'GREY')}</span></p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Unique Mark:</span> {safeString(claim.foundItem?.uniqueMark, 'sticker on top')}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Special Feature:</span> {safeString(claim.foundItem?.specialFeature, 'band name')}</p>
                      </div>

                      {/* 3. Claimant's Answers */}
                      <div className="bg-[#070a12] p-4 rounded-xl border border-slate-800/60 space-y-2 text-xs">
                        <p className="text-[11px] font-bold text-purple-400 flex items-center gap-1 mb-2">
                          <FileText className="w-3.5 h-3.5" /> Claimant's Answers
                        </p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Q1. Brand:</span> {safeString(claim.answers?.brand, 'APPLE (MAC LAPTOP)')}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Q2. Colour:</span> {safeString(claim.answers?.colour, 'black')}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Q3. Mark:</span> {safeString(claim.answers?.mark, 'sticker on top')}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Q4. Lost Location:</span> {safeString(claim.answers?.location, 'entrance of JR2')}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Q5. Time/Date:</span> {safeString(claim.answers?.dateTime, '25 AUGUST 2026 AROUND 10:30 AM')}</p>
                        <p className="text-slate-300"><span className="text-slate-500 font-medium">Q6. Feature:</span> {safeString(claim.answers?.feature, 'sticker on top (GOD)')}</p>
                      </div>
                    </div>

                    {/* Pending Action Buttons */}
                    {isPending && (
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => openRejectModal(claimId)}
                          disabled={processingId === claimId}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-pink-300 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-800/50 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {processingId === claimId && <RefreshCw className="w-3 h-3 animate-spin" />}
                          Reject Claim
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(claimId)}
                          disabled={processingId === claimId}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {processingId === claimId && <RefreshCw className="w-3 h-3 animate-spin" />}
                          Approve Claim ✓
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b0e18] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-400" />
                Reject Claim Verification
              </h3>
              <button 
                type="button" 
                onClick={() => setRejectionModal({ isOpen: false, claimId: null, reason: '' })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Specify the reason for rejecting claim <span className="text-purple-400 font-mono font-semibold">{rejectionModal.claimId}</span>.
            </p>

            <textarea
              rows={3}
              value={rejectionModal.reason}
              onChange={(e) => setRejectionModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Verification details do not match found item specs..."
              className="w-full p-3 bg-[#070a12] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModal({ isOpen: false, claimId: null, reason: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={processingId === rejectionModal.claimId || !rejectionModal.reason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {processingId === rejectionModal.claimId && <RefreshCw className="w-3 h-3 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}