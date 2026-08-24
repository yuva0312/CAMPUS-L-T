import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const FindMyItem = () => {
  const navigate = useNavigate();
  const [lostItems, setLostItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState('');

  // Selected lost item for matching
  const [selectedLostItem, setSelectedLostItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchError, setMatchError] = useState('');

  // Claim request feedback state
  const [claimStatus, setClaimStatus] = useState(null); // { foundItemId, message }

  useEffect(() => {
    fetchMyLostItems();
  }, []);

  const fetchMyLostItems = async () => {
    try {
      setLoadingItems(true);
      setError('');
      const response = await api.get('/lost-items/my');
      if (response.data.success) {
        setLostItems(response.data.data || []);
      }
    } catch (err) {
      console.error('Fetch my lost items error:', err);
      setError('Failed to load your lost items.');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleFindMatches = async (lostItem) => {
    setSelectedLostItem(lostItem);
    setMatches([]);
    setMatchError('');
    setLoadingMatches(true);
    setClaimStatus(null);

    const lostItemId = lostItem._id || lostItem.id;

    console.log('[FindMyItem Frontend] Selected Lost Item ID:', lostItemId);
    console.log('[FindMyItem Frontend] Selected Lost Item Details:', lostItem);

    try {
      const response = await api.get(`/matches/lost/${lostItemId}`);
      console.log('[FindMyItem Frontend] Matches response data:', response.data);
      if (response.data.success) {
        console.log('[FindMyItem Frontend] Matches received count:', response.data.data ? response.data.data.length : 0);
        setMatches(response.data.data || []);
      } else {
        setMatchError('Unable to fetch potential matches.');
      }
    } catch (err) {
      console.error('[FindMyItem Frontend] Fetch matches error:', err);
      setMatchError(err.response?.data?.message || 'Server error while searching potential matches.');
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleRequestClaim = (match) => {
    const matchId = match.foundItemId || `match_${Date.now()}`;
    navigate(`/claim/${matchId}`, {
      state: {
        match,
        lostItemId: selectedLostItem ? (selectedLostItem._id || selectedLostItem.id) : null,
      },
    });
  };

  const getMatchLevelStyle = (score, level) => {
    if (score >= 80 || level === 'High Potential Match') {
      return {
        badgeBg: 'rgba(16, 185, 129, 0.15)',
        badgeColor: '#10b981',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        levelText: 'High Potential Match',
      };
    }
    if (score >= 60 || level === 'Possible Match') {
      return {
        badgeBg: 'rgba(99, 102, 241, 0.15)',
        badgeColor: '#818cf8',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        levelText: 'Possible Match',
      };
    }
    return {
      badgeBg: 'rgba(148, 163, 184, 0.15)',
      badgeColor: '#94a3b8',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      levelText: 'Low Similarity',
    };
  };

  return (
    <div style={{ padding: '2rem 1rem 4rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="badge-pill" style={{ marginBottom: '0.75rem' }}>
            <span className="badge-dot" style={{ backgroundColor: '#818cf8', boxShadow: '0 0 8px #818cf8' }}></span> Smart Match Engine
          </div>
          <h1 className="hero-heading" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
            <span className="heading-white">Find My</span>{' '}
            <span className="heading-gradient">Item</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem' }}>
            Select one of your reported lost items to search for potential found matches across campus.
          </p>
        </div>

        <Link
          to="/report-lost"
          className="btn-register-glow"
          style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}
        >
          + Report New Lost Item
        </Link>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="alert-box alert-error" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* SECTION 1: MY LOST ITEMS LIST */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🔍</span> My Lost Items
        </h2>

        {loadingItems ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: '#94a3b8' }}>Loading your lost items...</p>
          </div>
        ) : lostItems.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📦</div>
            <h3 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '0.5rem' }}>No Reported Lost Items Found</h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>You must report a lost item first to search for potential matches.</p>
            <Link to="/report-lost" className="btn-register-glow" style={{ padding: '0.75rem 2rem', display: 'inline-block' }}>
              Report a Lost Item Now
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {lostItems.map((item) => {
              const itemId = item._id || item.id;
              const isSelected = selectedLostItem && (selectedLostItem._id || selectedLostItem.id) === itemId;

              return (
                <div
                  key={itemId}
                  className="glass-card"
                  style={{
                    padding: '1.35rem',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span
                        style={{
                          background: 'rgba(168, 85, 247, 0.15)',
                          color: '#c084fc',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        {item.category}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '600', textTransform: 'capitalize' }}>
                        ● {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.4rem' }}>
                      {item.itemName}
                    </h3>

                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                      📍 <strong>Location:</strong> {item.location}
                      <br />
                      📅 <strong>Lost Date:</strong> {new Date(item.lostDate).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleFindMatches(item)}
                    className="btn-register-glow"
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      fontSize: '0.95rem',
                      background: isSelected ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : undefined,
                    }}
                  >
                    {isSelected ? '✓ Viewing Matches' : 'Find Potential Matches'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: MATCH RESULTS PANEL */}
      {selectedLostItem && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ color: '#818cf8', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                MATCH RESULTS FOR:
              </span>
              <h2 style={{ fontSize: '1.6rem', color: '#ffffff', fontWeight: '800' }}>
                {selectedLostItem.itemName} ({selectedLostItem.category})
              </h2>
            </div>

            <span style={{ fontSize: '0.9rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 1rem', borderRadius: '12px' }}>
              📍 Lost at {selectedLostItem.location}
            </span>
          </div>

          {/* PRIVACY WARNING BANNER */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '12px',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.75rem',
              fontSize: '0.9rem',
              color: '#a5b4fc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span>🔒</span>
            <span>
              <strong>Privacy Protection Active:</strong> Detailed photos, brand names, and private marks are strictly hidden. You must complete Student Care verification when requesting a claim.
            </span>
          </div>

          {claimStatus && (
            <div className="alert-box" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', marginBottom: '1.5rem' }}>
              <span>🎉</span> {claimStatus.message}
            </div>
          )}

          {loadingMatches ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚡</div>
              <p style={{ color: '#94a3b8' }}>Searching campus inventory for matches...</p>
            </div>
          ) : matchError ? (
            <div className="alert-box alert-error">
              <span>⚠️</span> {matchError}
            </div>
          ) : matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '1.05rem' }}>No potential matches found for this item yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {matches.map((match) => {
                const levelStyle = getMatchLevelStyle(match.matchScore, match.matchLevel);
                const foundDateFormatted = new Date(match.foundDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });

                const hasClaimed = claimStatus && claimStatus.foundItemId === match.foundItemId;

                return (
                  <div
                    key={match.foundItemId}
                    className="glass-card"
                    style={{
                      padding: '1.5rem',
                      borderRadius: '16px',
                      border: levelStyle.border,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    {/* MATCH HEADER & BADGE */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#ffffff',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Potential Match
                        </span>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: levelStyle.badgeColor, display: 'block', lineHeight: 1 }}>
                            {match.matchScore}%
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AI Score</span>
                        </div>
                      </div>

                      {/* MATCH LEVEL PILL */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <span
                          style={{
                            background: levelStyle.badgeBg,
                            color: levelStyle.badgeColor,
                            padding: '0.3rem 0.85rem',
                            borderRadius: '9999px',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            display: 'inline-block',
                          }}
                        >
                          ● {levelStyle.levelText}
                        </span>
                      </div>

                      {/* SAFE PUBLIC INFORMATION ONLY */}
                      <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                          <div>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>Category</span>
                            <strong style={{ color: '#ffffff' }}>{match.category}</strong>
                          </div>

                          <div>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>General Item</span>
                            <strong style={{ color: '#ffffff' }}>{match.generalItemName}</strong>
                          </div>

                          <div>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>Found Location</span>
                            <strong style={{ color: '#ffffff' }}>{match.foundLocation}</strong>
                          </div>

                          <div>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>Found Date</span>
                            <strong style={{ color: '#ffffff' }}>{foundDateFormatted}</strong>
                          </div>

                          {match.approximateTime && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>Approximate Time</span>
                              <strong style={{ color: '#ffffff' }}>{match.approximateTime} {match.timeRange ? `(${match.timeRange})` : ''}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTON: CLAIM ITEM ONLY */}
                    <button
                      onClick={() => handleRequestClaim(match)}
                      disabled={hasClaimed}
                      className="btn-register-glow"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontSize: '1rem',
                        background: hasClaimed
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: hasClaimed ? '#34d399' : '#ffffff',
                        border: hasClaimed ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                        cursor: hasClaimed ? 'default' : 'pointer',
                      }}
                    >
                      {hasClaimed ? '✓ Claim Requested' : 'Claim Item'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindMyItem;
