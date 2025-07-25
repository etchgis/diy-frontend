'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-[#e5eaef] flex">
      {/* Left Column - Logo */}
      <div className="w-[196px] bg-white border-r border-[#e2e8f0] flex flex-col items-center pt-6">
        <img src="/images/nysdot-logo.png" alt="New York State Department of Transportation" className="w-36 mb-6" />
      </div>

      {/* Right Column - Main Content */}
      <div className="flex-1 bg-white">
        {/* Header */}
        <header className="bg-white border-b border-[#e2e8f0] px-6 py-4 flex justify-end">
          <Button variant="ghost" size="icon" className="text-[#606061]">
            <HelpCircle className="w-5 h-5" />
          </Button>
        </header>

        {/* Main Content */}
        <main className="px-8 py-12">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-semibold text-[#4a5568] mb-6">
              Welcome to the NYSDOT Mobility Screens Builder.
            </h1>
            <p className="text-[#606061] text-lg max-w-4xl mx-auto leading-relaxed">
              This tool will help you create the various screens that display real-time, local traffic and transit
              information. Through this tool, you will be able to create your own transportation information screens,
              publish the information on-site/on your own monitors, and display the information to your desired audience
              through a public URL.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create New Set Card */}
            <Card className="bg-[#0b5583] border-0">
              <CardContent className="p-8">
                <h2 className="text-white text-2xl font-semibold mb-8">Create a new set of mobility screens</h2>

                <div className="space-y-6">
                  <div>
                    <p className="text-white mb-4">1. Set an initial central location for the screens</p>
                    <div className="flex gap-3">
                      <Input placeholder="i.e Albany Airport" className="bg-white text-[#1a202c] flex-1" />
                      <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium px-6">Set</Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-white mb-4">
                      2. Select a template from the drop down list to get started with your first screen.
                    </p>
                    <div className="flex gap-3">
                      <Select>
                        <SelectTrigger className="bg-white text-[#1a202c] flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <SelectValue placeholder="Select a Screen Template" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="template1">Template 1</SelectItem>
                          <SelectItem value="template2">Template 2</SelectItem>
                          <SelectItem value="template3">Template 3</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={() => {router.push('/editor')}} className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium px-6">Create</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Existing Set Card */}
            <Card className="bg-[#6e9ab5] border-0">
              <CardContent className="p-8">
                <h2 className="text-[#1a202c] text-2xl font-semibold mb-8">
                  Edit an existing set of mobility screens or add a new screen
                </h2>

                <div className="space-y-6">
                  <p className="text-[#2d3748] text-sm">
                    Insert a published Mobility Screen URL to edit an existing mobility screen
                  </p>

                  <div className="flex gap-3">
                    <Input className="bg-white text-[#1a202c] flex-1" />
                    <Button className="bg-[#face00] hover:bg-[#face00]/90 text-black font-medium px-6">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

