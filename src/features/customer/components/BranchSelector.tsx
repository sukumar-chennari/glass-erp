import { useState, useMemo } from 'react';
import { MapPin, Navigation, Search, CheckCircle2, Clock, Phone, AlertTriangle } from 'lucide-react';
import { BRANCHES, haversineKm, type Branch } from '@/mocks/branches';
import styles from './BranchSelector.module.css';

type SelectionMode = 'gps' | 'search' | 'all';
type GpsStatus = 'idle' | 'loading' | 'success' | 'denied';

interface UserCoords { lat: number; lng: number; }

interface BranchSelectorProps {
  value:    string | null;
  onChange: (branchId: string, branchName: string) => void;
}

export function BranchSelector({ value, onChange }: BranchSelectorProps) {
  const [mode,      setMode]      = useState<SelectionMode>('gps');
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [coords,    setCoords]    = useState<UserCoords | null>(null);
  const [query,     setQuery]     = useState('');

  function detectLocation() {
    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus('success');
      },
      () => setGpsStatus('denied'),
      { timeout: 10_000 },
    );
  }

  const branchesWithDistance = useMemo<Array<Branch & { distKm?: number }>>(() => {
    if (!coords) return BRANCHES.map((b) => ({ ...b }));
    return BRANCHES
      .map((b) => ({ ...b, distKm: haversineKm(coords.lat, coords.lng, b.lat, b.lng) }))
      .sort((a, b) => (a.distKm ?? 999) - (b.distKm ?? 999));
  }, [coords]);

  const filteredBranches = useMemo(() => {
    if (mode !== 'search' || !query.trim()) return branchesWithDistance;
    const q = query.toLowerCase();
    return branchesWithDistance.filter((b) =>
      b.name.toLowerCase().includes(q)    ||
      b.area.toLowerCase().includes(q)    ||
      b.address.toLowerCase().includes(q),
    );
  }, [branchesWithDistance, mode, query]);

  const displayBranches =
    mode === 'gps'    ? branchesWithDistance :
    mode === 'search' ? filteredBranches     :
    branchesWithDistance;

  return (
    <div className={styles.wrapper}>
      {/* Mode tabs */}
      <div className={styles.modeTabs}>
        <button
          className={`${styles.modeTab} ${mode === 'gps' ? styles.modeTabActive : ''}`}
          onClick={() => setMode('gps')}
          type="button"
        >
          <Navigation size={13} />
          Nearest
        </button>
        <button
          className={`${styles.modeTab} ${mode === 'search' ? styles.modeTabActive : ''}`}
          onClick={() => setMode('search')}
          type="button"
        >
          <Search size={13} />
          Search
        </button>
        <button
          className={`${styles.modeTab} ${mode === 'all' ? styles.modeTabActive : ''}`}
          onClick={() => setMode('all')}
          type="button"
        >
          <MapPin size={13} />
          All
        </button>
      </div>

      {/* GPS mode prompt */}
      {mode === 'gps' && gpsStatus === 'idle' && (
        <button className={styles.gpsPrompt} onClick={detectLocation} type="button">
          <Navigation size={18} />
          <div className={styles.gpsPromptBody}>
            <span className={styles.gpsPromptTitle}>Detect my location</span>
            <span className={styles.gpsPromptSub}>Find the nearest WindX service centre</span>
          </div>
        </button>
      )}

      {mode === 'gps' && gpsStatus === 'loading' && (
        <div className={styles.gpsLoading}>
          <span className={styles.spinner} />
          Detecting your location…
        </div>
      )}

      {mode === 'gps' && gpsStatus === 'denied' && (
        <div className={styles.gpsAlert}>
          <AlertTriangle size={14} />
          Location access denied. Use Search to find a branch.
        </div>
      )}

      {/* Search input */}
      {mode === 'search' && (
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Area, pincode or branch name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {/* Branch list */}
      {(mode !== 'gps' || gpsStatus === 'success') && (
        <div className={styles.list}>
          {displayBranches.length === 0 ? (
            <p className={styles.noResults}>No branches match your search.</p>
          ) : (
            displayBranches.map((branch) => {
              const isSelected = branch.id === value;
              return (
                <button
                  key={branch.id}
                  type="button"
                  className={`${styles.branchCard} ${isSelected ? styles.branchCardSelected : ''}`}
                  onClick={() => onChange(branch.id, branch.name)}
                >
                  <div className={styles.branchLeft}>
                    <div className={styles.branchName}>{branch.name}</div>
                    <div className={styles.branchAddr}>
                      <MapPin size={11} />
                      {branch.address}
                    </div>
                    <div className={styles.branchMeta}>
                      <span>
                        <Phone size={11} />
                        {branch.phone}
                      </span>
                      <span>
                        <Clock size={11} />
                        {branch.openTime}–{branch.closeTime}
                      </span>
                    </div>
                  </div>
                  <div className={styles.branchRight}>
                    {branch.distKm !== undefined && (
                      <span className={styles.distance}>
                        {branch.distKm < 1
                          ? `${(branch.distKm * 1000).toFixed(0)} m`
                          : `${branch.distKm.toFixed(1)} km`}
                      </span>
                    )}
                    {isSelected && <CheckCircle2 size={18} className={styles.checkIcon} />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
