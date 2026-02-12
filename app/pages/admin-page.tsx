'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

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
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingScreens, setLoadingScreens] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchScreens = async (authPassword: string) => {
    setLoadingScreens(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      const response = await fetch(`${backendUrl}/shortcodes`, {
        headers: {
          'Authorization': `Bearer ${authPassword}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch screens');
      }

      const data = await response.json();
      console.log(data.shortcodes);
      setScreens(data.shortcodes || []);
    } catch (err) {
      console.error('Error fetching screens:', err);
      setError('Failed to load screens');
    } finally {
      setLoadingScreens(false);
    }
  };

  const filteredScreens = screens.filter(screen =>
    screen.shortcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      if (!backendUrl) {
        setError('Backend URL not configured');
        setLoading(false);
        return;
      }

      const response = await fetch(`${backendUrl}/admin-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError('Invalid password');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
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

      {/* Right Column - Main Content */}
      <div className="flex-1 bg-white flex flex-col">
        {!isAuthenticated ? (
          <main className="flex-1 px-8 py-12 flex items-center justify-center">
            <Card className="w-full max-w-md bg-[#0b5583] border-0">
              <CardContent className="p-8">
                <h2 className="text-white text-2xl font-semibold mb-6 text-center">
                  Admin Access
                </h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <Input
                      type="password"
                      placeholder="Enter admin password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className="bg-white text-[#1a202c] w-full"
                      disabled={loading}
                    />
                    {error && (
                      <p className="text-red-300 text-sm mt-2">{error}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#face00] hover:bg-[#face00]/90 text-black font-medium"
                    disabled={loading}
                  >
                    {loading ? 'Authenticating...' : 'Submit'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </main>
        ) : (
          <>
            {/* Fixed Header */}
            <div className="bg-white border-b border-[#e2e8f0] px-8 py-6 flex justify-between items-center">
              <h1 className="text-3xl font-semibold text-[#4a5568]">
                Created Screens
              </h1>
              <div className="w-80">
                <Input
                  type="text"
                  placeholder="Search by shortcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white text-[#1a202c]"
                />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {loadingScreens ? (
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
                    <Card key={screen.shortcode} className="bg-white border border-[#e2e8f0]">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[#1a202c] mb-2">
                              {screen.shortcode}
                            </h3>
                            <p className="text-sm text-[#606061] mb-2">
                              {screen.url}
                            </p>
                            <p className="text-xs text-[#9ca3af]">
                              Last Modified: {new Date(screen.lastModified).toLocaleDateString()} {new Date(screen.lastModified).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-[#9ca3af]">
                              Address: {screen.address || 'N/A'}
                            </p>
                            {screen.firstScreen?.data?.title && (
                              <p className="text-xs text-[#9ca3af]">
                                First Screen Title: {screen.firstScreen.data.title}
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            <Button
                              onClick={() => window.open(screen.url, '_blank')}
                              className="bg-[#0b5583] hover:bg-[#0b5583]/90 text-white px-4 py-2"
                            >
                              View Screen
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
