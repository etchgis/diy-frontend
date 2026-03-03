'use client'

import { MermaidDiagram } from '@/components/tech-details/mermaid-diagram'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export default function TechDetailsPage() {
  const handlePrint = () => {
    window.print()
  }

  const systemTopology = `
flowchart LR
    subgraph Facility["Your Facility"]
        TV["Display Device"]
    end

    subgraph Cloud["Cloud Services"]
        App["NYSDOT Mobility Screens"]
    end

    subgraph Transit["Transit Data Sources"]
        MTA["MTA"]
        CDTA["CDTA"]
        NFTA["NFTA"]
        NYSDOT["NYSDOT"]
    end

    subgraph Maps["Mapping"]
        Mapbox["Mapbox"]
    end

    TV -- "HTTPS" --> App
    App -- "HTTPS" --> MTA
    App -- "HTTPS" --> CDTA
    App -- "HTTPS" --> NFTA
    App -- "HTTPS" --> NYSDOT
    App -- "HTTPS" --> Mapbox
`

  const dataFlowDiagram = `
flowchart LR
    subgraph Step1["1. Initial Load"]
        TV1["Display Device"] --> |"Request screen"| App1["Mobility Screens"]
        App1 --> |"Return layout"| TV1
    end

    subgraph Step2["2. Periodic Refresh"]
        TV2["Display Device"] --> |"Request updates"| App2["Mobility Screens"]
        App2 --> |"Fetch arrivals"| Transit["Transit Feeds"]
        Transit --> |"Return data"| App2
        App2 --> |"Updated info"| TV2
    end
`

  return (
    <div className="min-h-screen bg-[#e5eaef] flex print:bg-white">
      {/* Left Column - Logo */}
      <div className="w-[196px] bg-white border-r border-[#e2e8f0] flex flex-col items-center pt-6 print:hidden">
        <img src="/images/nysdot-logo.png" alt="New York State Department of Transportation" className="w-36 mb-6" />
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white">
        {/* Header */}
        <header className="bg-white border-b border-[#e2e8f0] px-6 py-4 flex justify-between items-center print:hidden">
          <h1 className="text-xl font-semibold text-[#4a5568]">Technical Information for Displaying a Mobility Screen</h1>
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </Button>
        </header>

        {/* Print Header */}
        <div className="hidden print:block p-8 border-b">
          <div className="flex items-center gap-4">
            <img src="/images/nysdot-logo.png" alt="NYSDOT" className="w-24" />
            <div>
              <h1 className="text-2xl font-bold text-[#0b5583]">NYSDOT Mobility Screens</h1>
              <p className="text-[#4a5568]">Technical Information for Displaying a Mobility Screen</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="px-8 py-8 max-w-5xl">
          {/* Overview */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#0b5583] mb-4">System Overview</h2>
            <p className="text-[#4a5568] leading-relaxed mb-4">
              The NYSDOT Mobility Screens platform is a cloud-hosted digital signage solution that displays
              real-time transit and transportation information. The system requires only a standard web browser
              on your display devices—no special software installation or on-premise servers are needed.
            </p>
            <div className="bg-[#e5eaef] rounded-lg p-4">
              <h3 className="font-semibold text-[#4a5568] mb-2">Key Points</h3>
              <ul className="list-disc list-inside text-[#4a5568] space-y-1">
                <li>Fully cloud-hosted solution—no on-premise servers required</li>
                <li>All communications use HTTPS encryption (TLS 1.2+)</li>
                <li>No personal or health information (PII/PHI) is collected or processed</li>
                <li>Display devices only need internet access and a modern web browser</li>
              </ul>
            </div>
          </section>

          {/* System Topology */}
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-2xl font-semibold text-[#0b5583] mb-4">System Topology</h2>
            <p className="text-[#4a5568] mb-4">
              The following diagram shows how display devices connect to the Mobility Screens service
              and how data flows from transit agencies.
            </p>
            <div className="border rounded-lg p-4 bg-white overflow-x-auto">
              <MermaidDiagram chart={systemTopology} className="flex justify-center" />
            </div>
          </section>

          {/* Data Flow - Display */}
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-2xl font-semibold text-[#0b5583] mb-4">Data Flow: Display Operation</h2>
            <p className="text-[#4a5568] mb-4">
              When a display device loads a screen, it requests configuration and transit data from
              the cloud service. Transit data is automatically refreshed at regular intervals to show
              current arrival times.
            </p>
            <div className="border rounded-lg p-4 bg-white overflow-x-auto">
              <MermaidDiagram chart={dataFlowDiagram} className="flex justify-center" />
            </div>
          </section>

          {/* Network Requirements */}
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-2xl font-semibold text-[#0b5583] mb-4">Network Requirements</h2>
            <p className="text-[#4a5568] mb-4">
              Display devices require outbound HTTPS access (port 443) to the following domains:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#e2e8f0]">
                <thead>
                  <tr className="bg-[#0b5583] text-white">
                    <th className="border border-[#e2e8f0] px-4 py-2 text-left">Domain</th>
                    <th className="border border-[#e2e8f0] px-4 py-2 text-left">Purpose</th>
                    <th className="border border-[#e2e8f0] px-4 py-2 text-left">Protocol</th>
                  </tr>
                </thead>
                <tbody className="text-[#4a5568]">
                  <tr>
                    <td className="border border-[#e2e8f0] px-4 py-2 font-mono text-sm">*.amplifyapp.com</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">Web application hosting</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">HTTPS (443)</td>
                  </tr>
                  <tr className="bg-[#f7fafc]">
                    <td className="border border-[#e2e8f0] px-4 py-2 font-mono text-sm">api.etch.app</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">Screen configuration & transit data API</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">HTTPS (443)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#e2e8f0] px-4 py-2 font-mono text-sm">*.mapbox.com</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">Map tiles and location services</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">HTTPS (443)</td>
                  </tr>
                  <tr className="bg-[#f7fafc]">
                    <td className="border border-[#e2e8f0] px-4 py-2 font-mono text-sm">*.amazonaws.com</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">Static assets and images</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">HTTPS (443)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[#718096] text-sm mt-2">
              * No inbound connections to your network are required.
            </p>
          </section>

          {/* Display Device Requirements */}
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-2xl font-semibold text-[#0b5583] mb-4">Display Device Requirements</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#e2e8f0]">
                <thead>
                  <tr className="bg-[#0b5583] text-white">
                    <th className="border border-[#e2e8f0] px-4 py-2 text-left">Requirement</th>
                    <th className="border border-[#e2e8f0] px-4 py-2 text-left">Specification</th>
                  </tr>
                </thead>
                <tbody className="text-[#4a5568]">
                  <tr>
                    <td className="border border-[#e2e8f0] px-4 py-2 font-semibold">Web Browser</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">Chrome, Edge, Firefox, or Safari (recent versions)</td>
                  </tr>
                  <tr className="bg-[#f7fafc]">
                    <td className="border border-[#e2e8f0] px-4 py-2 font-semibold">Display Resolution</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">1920×1080 (Full HD) recommended</td>
                  </tr>
                  <tr>
                    <td className="border border-[#e2e8f0] px-4 py-2 font-semibold">Network Connectivity</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">10 Mbps+ stable internet connection</td>
                  </tr>
                  <tr className="bg-[#f7fafc]">
                    <td className="border border-[#e2e8f0] px-4 py-2 font-semibold">Software Installation</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">None required, runs in browser</td>
                  </tr>
                  <tr>
                    <td className="border border-[#e2e8f0] px-4 py-2 font-semibold">Local Storage</td>
                    <td className="border border-[#e2e8f0] px-4 py-2">No data stored locally</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Data Sources */}
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-2xl font-semibold text-[#0b5583] mb-4">Transit Data Sources</h2>
            <p className="text-[#4a5568] mb-4">
              Real-time transit information is sourced from official New York State transit agencies:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-[#f7fafc]">
                <h3 className="font-semibold text-[#4a5568] mb-2">New York City Region</h3>
                <ul className="text-[#4a5568] text-sm space-y-1">
                  <li>• MTA Subway</li>
                  <li>• MTA Bus</li>
                  <li>• Long Island Rail Road (LIRR)</li>
                  <li>• Metro-North Railroad</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4 bg-[#f7fafc]">
                <h3 className="font-semibold text-[#4a5568] mb-2">Upstate & Regional</h3>
                <ul className="text-[#4a5568] text-sm space-y-1">
                  <li>• CDTA (Capital District)</li>
                  <li>• NFTA (Buffalo/Niagara)</li>
                  <li>• Suffolk County Transit</li>
                  <li>• Other regional agencies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-2xl font-semibold text-[#0b5583] mb-4">Security & Privacy</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-[#0b5583] pl-4">
                <h3 className="font-semibold text-[#4a5568]">Data in Transit</h3>
                <p className="text-[#718096] text-sm">All communications use HTTPS with TLS 1.2 or higher encryption.</p>
              </div>
              <div className="border-l-4 border-[#0b5583] pl-4">
                <h3 className="font-semibold text-[#4a5568]">Data at Rest</h3>
                <p className="text-[#718096] text-sm">Screen configurations are stored encrypted in cloud infrastructure.</p>
              </div>
              <div className="border-l-4 border-[#0b5583] pl-4">
                <h3 className="font-semibold text-[#4a5568]">No PII/PHI</h3>
                <p className="text-[#718096] text-sm">The system does not collect, process, or store any personal or health information.</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-[#e2e8f0] pt-6 mt-10 text-[#718096] text-sm">
            <p>NYSDOT Mobility Screens • Technical Information for Displaying a Mobility Screen</p>
          </footer>
        </main>
      </div>
    </div>
  )
}
