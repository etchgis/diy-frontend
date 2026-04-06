'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect, useCallback } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface ScreenMetrics {
  screen_views: number;
  qr_visits: number;
  heartbeats: number;
  last_seen?: string;
  // Timeseries data from backend — array of { timestamp, event } or bucketed { time, screen_views, qr_visits, heartbeats }
  timeseries?: { time: string; screen_views: number; qr_visits: number; heartbeats: number }[];
}

interface Screen {
  shortcode: string;
  url: string;
  lastModified: string;
  size: number;
  address?: string;
  firstScreen?: {
    data?: {
      title?: string;
    };
  };
  metrics?: ScreenMetrics;
}

const SESSION_KEY = 'admin_auth_password';

const CUSTOM_SCREENS: Screen[] = [
  {
    shortcode: 'Mets',
    url: 'https://mets.etch.app',
    lastModified: '',
    size: 0,
    address: 'Citi Field, Queens, NY',
    metrics: { screen_views: 0, qr_visits: 0, heartbeats: 0 },
  },
];

function formatUptime(heartbeats: number) {
  const totalSecs = heartbeats * 30;
  const mins = Math.floor(totalSecs / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function MetricBadge({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-[#e5eaef] rounded px-3 py-1.5 min-w-[80px]">
      <span className="text-sm font-semibold text-[#0b5583]">{value}</span>
      <span className="text-[10px] text-[#9ca3af] uppercase tracking-wide">{label}</span>
    </div>
  );
}

function MetricsChart({ timeseries }: { timeseries: ScreenMetrics['timeseries'] }) {
  if (!timeseries || timeseries.length === 0) {
    return <p className="text-xs text-[#9ca3af] mt-2">No timeseries data available yet.</p>;
  }
  // Buckets from backend are UTC midnight — always display in UTC so dates don't shift
  const parseTS = (v: unknown) => {
    const s = String(v);
    return typeof s === 'string' && !s.endsWith('Z') && !s.includes('+') ? s + 'Z' : s;
  };

  console.log('[METRICS GRAPH] raw timeseries:', timeseries);
  console.log('[METRICS GRAPH] first bucket raw:', timeseries[0]?.time);
  console.log('[METRICS GRAPH] first bucket parsed:', parseTS(timeseries[0]?.time));
  console.log('[METRICS GRAPH] first bucket as Date:', new Date(parseTS(timeseries[0]?.time)).toString());
  console.log('[METRICS GRAPH] first bucket UTC display:', new Date(parseTS(timeseries[0]?.time)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }));
  console.log('[METRICS GRAPH] browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

  return (
    <div className="mt-4" style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={timeseries} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={(v) => {
              try {
                return new Date(parseTS(v)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
              } catch { return String(v); }
            }}
          />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} width={28} />
          <Tooltip
            labelFormatter={(v) => {
              try {
                return new Date(parseTS(v)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
              } catch { return String(v); }
            }}
            contentStyle={{ fontSize: 11 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="screen_views" name="TV Views" stroke="#0b5583" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="qr_visits" name="QR Visits" stroke="#face00" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="heartbeats" name="Heartbeats" stroke="#10b981" dot={false} strokeWidth={1} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScreenCard({
  screen,
  confirmReset,
  resetLoading,
  resetSuccess,
  onResetClick,
  onResetConfirm,
  onResetCancel,
  isCustom = false,
}: {
  screen: Screen;
  confirmReset: string | null;
  resetLoading: string | null;
  resetSuccess: string | null;
  onResetClick: (shortcode: string) => void;
  onResetConfirm: (shortcode: string) => void;
  onResetCancel: () => void;
  isCustom?: boolean;
}) {
  const [showGraph, setShowGraph] = useState(false);
  const m = screen.metrics ?? { screen_views: 0, qr_visits: 0, heartbeats: 0 };

  return (
    <Card className="bg-white border border-[#e2e8f0]">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#1a202c] mb-2">{screen.shortcode}</h3>
            <p className="text-sm text-[#606061] mb-2">{screen.url}</p>
            {screen.lastModified && (
              <p className="text-xs text-[#9ca3af]">
                Last Modified: {new Date(screen.lastModified).toLocaleDateString()} {new Date(screen.lastModified).toLocaleTimeString()}
              </p>
            )}
            <p className="text-xs text-[#9ca3af]">Address: {screen.address || 'N/A'}</p>
            {screen.firstScreen?.data?.title && (
              <p className="text-xs text-[#9ca3af]">First Screen Title: {screen.firstScreen.data.title}</p>
            )}

            {/* Metrics badges — always shown, default to 0 */}
            <div className="flex gap-4 mt-3 flex-wrap items-center">
              <MetricBadge value={m.screen_views} label="TV Views" />
              <MetricBadge value={m.qr_visits} label="QR Visits" />
              <MetricBadge value={formatUptime(m.heartbeats)} label="Uptime" />
              {m.last_seen && (
                <span className="text-[10px] text-[#9ca3af]">
                  Last seen {new Date(m.last_seen).toLocaleDateString()} {new Date(m.last_seen).toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => setShowGraph(g => !g)}
                className="text-[10px] text-[#0b5583] underline ml-1"
              >
                {showGraph ? 'Hide graph' : 'View graph'}
              </button>
            </div>

            {showGraph && <MetricsChart timeseries={m.timeseries} />}
          </div>

          <div className="ml-4 flex flex-col items-end gap-2">
            <Button
              onClick={() => window.open(screen.url, '_blank')}
              className="bg-[#0b5583] hover:bg-[#0b5583]/90 text-white px-4 py-2"
            >
              View Screen
            </Button>

            {!isCustom && (
              confirmReset === screen.shortcode ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9ca3af]">Reset publish password?</span>
                  <Button
                    onClick={() => onResetConfirm(screen.shortcode)}
                    disabled={resetLoading === screen.shortcode}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs h-auto"
                  >
                    {resetLoading === screen.shortcode ? 'Resetting...' : 'Confirm'}
                  </Button>
                  <Button onClick={onResetCancel} variant="outline" className="px-3 py-1 text-xs h-auto">
                    Cancel
                  </Button>
                </div>
              ) : resetSuccess === screen.shortcode ? (
                <span className="text-xs text-green-600 font-medium">
                  Password reset — user will be prompted to set a new one on next publish.
                </span>
              ) : (
                <Button
                  onClick={() => onResetClick(screen.shortcode)}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 text-sm"
                >
                  Reset Password
                </Button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingScreens, setLoadingScreens] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'created' | 'custom'>('created');
  const [refreshing, setRefreshing] = useState(false);

  // Restore cached session on mount
  useEffect(() => {
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      setAuthPassword(cached);
      setIsAuthenticated(true);
    }
  }, []);

  const fetchScreens = useCallback(async (pwd: string, isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoadingScreens(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      const [screensResponse, metricsResponse] = await Promise.all([
        fetch(`${backendUrl}/shortcodes`, { headers: { 'Authorization': `Bearer ${pwd}` } }),
        fetch(`${backendUrl}/metrics`, { headers: { 'Authorization': `Bearer ${pwd}` } }),
      ]);

      if (!screensResponse.ok) throw new Error('Failed to fetch screens');

      const screensData = await screensResponse.json();
      const metricsData = metricsResponse.ok ? await metricsResponse.json() : {};
      const metricsMap: Record<string, ScreenMetrics> = metricsData.metrics || metricsData || {};

      const screensWithMetrics = (screensData.shortcodes || []).map((screen: Screen) => ({
        ...screen,
        metrics: metricsMap[screen.shortcode] ?? { screen_views: 0, qr_visits: 0, heartbeats: 0 },
      }));

      setScreens(screensWithMetrics);
    } catch (err) {
      console.error('Error fetching screens:', err);
      setError('Failed to load screens');
    } finally {
      isRefresh ? setRefreshing(false) : setLoadingScreens(false);
    }
  }, []);

  // Auto-fetch once authenticated via session cache
  useEffect(() => {
    if (isAuthenticated && authPassword && screens.length === 0) {
      fetchScreens(authPassword);
    }
  }, [isAuthenticated, authPassword, screens.length, fetchScreens]);

  const handleResetPassword = async (shortcode: string) => {
    setResetLoading(shortcode);
    setResetSuccess(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${backendUrl}/admin/reset-password/${shortcode}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authPassword}` },
      });
      if (!response.ok) throw new Error('Reset failed');
      setResetSuccess(shortcode);
      setTimeout(() => setResetSuccess(null), 4000);
    } catch (err) {
      console.error('Error resetting password:', err);
    } finally {
      setResetLoading(null);
      setConfirmReset(null);
    }
  };

  const filteredScreens = screens.filter(screen => {
    const q = searchQuery.toLowerCase();
    return (
      screen.shortcode.toLowerCase().includes(q) ||
      (screen.address?.toLowerCase().includes(q) ?? false)
    );
  });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) { setError('Backend URL not configured'); return; }

      const response = await fetch(`${backendUrl}/admin-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) { setError('Invalid password'); return; }

      const data = await response.json();
      if (data.success) {
        sessionStorage.setItem(SESSION_KEY, password);
        setAuthPassword(password);
        setIsAuthenticated(true);
        await fetchScreens(password);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e5eaef] flex">
      {/* Left Column - Logo */}
      <div className="w-[196px] bg-white border-r border-[#e2e8f0] flex flex-col items-center pt-6">
        <img src="/images/nysdot-logo.png" alt="New York State Department of Transportation" className="w-36 mb-6" />
      </div>

      {/* Right Column */}
      <div className="flex-1 bg-white flex flex-col">
        {!isAuthenticated ? (
          <main className="flex-1 px-8 py-12 flex items-center justify-center">
            <Card className="w-full max-w-md bg-[#0b5583] border-0">
              <CardContent className="p-8">
                <h2 className="text-white text-2xl font-semibold mb-6 text-center">Admin Access</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <Input
                      type="password"
                      placeholder="Enter admin password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      className="bg-white text-[#1a202c] w-full"
                      disabled={loading}
                    />
                    {error && <p className="text-red-300 text-sm mt-2">{error}</p>}
                  </div>
                  <Button type="submit" className="w-full bg-[#face00] hover:bg-[#face00]/90 text-black font-medium" disabled={loading}>
                    {loading ? 'Authenticating...' : 'Submit'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </main>
        ) : (
          <>
            {/* Tabs + Search + Refresh */}
            <div className="bg-white border-b border-[#e2e8f0] px-8 pt-6 pb-0">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-semibold text-[#4a5568]">Mobility Screens Admin</h1>
                <div className="flex items-center gap-3">
                  <div className="w-72">
                    <Input
                      type="text"
                      placeholder="Search by shortcode or address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white text-[#1a202c]"
                    />
                  </div>
                  <Button
                    onClick={() => fetchScreens(authPassword, true)}
                    disabled={refreshing}
                    variant="outline"
                    className="border-[#e2e8f0] text-[#4a5568]"
                  >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex gap-0">
                {(['created', 'custom'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-[#0b5583] text-[#0b5583]'
                        : 'border-transparent text-[#9ca3af] hover:text-[#4a5568]'
                    }`}
                  >
                    {tab === 'created' ? 'Created Screens' : 'Custom Screens'}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {activeTab === 'custom' ? (
                <div className="space-y-4 max-w-6xl mx-auto">
                  {CUSTOM_SCREENS.map((screen) => (
                    <ScreenCard
                      key={screen.shortcode}
                      screen={screen}
                      confirmReset={null}
                      resetLoading={null}
                      resetSuccess={null}
                      onResetClick={() => {}}
                      onResetConfirm={() => {}}
                      onResetCancel={() => {}}
                      isCustom
                    />
                  ))}
                </div>
              ) : loadingScreens ? (
                <Card className="bg-white border border-[#e2e8f0]">
                  <CardContent className="p-8 flex justify-center items-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-[#0b5583] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[#606061]">Loading screens...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredScreens.length === 0 ? (
                <Card className="bg-white border border-[#e2e8f0]">
                  <CardContent className="p-8 text-center">
                    <p className="text-[#606061]">
                      {searchQuery ? 'No screens match your search.' : 'No screens have been created yet.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4 max-w-6xl mx-auto">
                  {filteredScreens.map((screen) => (
                    <ScreenCard
                      key={screen.shortcode}
                      screen={screen}
                      confirmReset={confirmReset}
                      resetLoading={resetLoading}
                      resetSuccess={resetSuccess}
                      onResetClick={(sc) => setConfirmReset(sc)}
                      onResetConfirm={handleResetPassword}
                      onResetCancel={() => setConfirmReset(null)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
