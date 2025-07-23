'use client'

import Image from "next/image"
import { HelpCircle, FileText } from "lucide-react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function LandingPage() {
  const router = useRouter()
  return (
    <main className="grid min-h-screen grid-cols-[300px_1fr] bg-gray-50">
      {/* ─────────────── Left column (sidebar) ─────────────── */}
      <aside className="flex flex-row items-start gap-4 px-6 py-6 border-r border-gray-200 bg-white">
        <Image
          src="/images/ny-state-logo.png"
          alt="New York State Logo"
          width={100}
          height={40}
          className="h-10 w-auto object-contain"
        />
        {/* Department copy */}
        <div
          className="text-left text-sm font-semibold leading-snug text-gray-800"
          style={{ fontFamily: "D Sari, sans-serif" }}
        >
          |
        </div>
        <div
          className="text-left text-sm font-semibold leading-snug text-gray-800"
          style={{ fontFamily: "D Sari, sans-serif" }}
        >
          Department of
          <br /> Transportation
        </div>
      </aside>

      {/* ─────────────── Right column ─────────────── */}
      <div className="flex flex-col">
        {/* Header */}
        <header className="flex justify-end items-center px-6 py-4 bg-white border-b border-gray-200">
          <Button variant="ghost" size="sm" aria-label="Help">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </header>

        {/* Main content */}
        <section className="flex flex-col p-6 flex-1">
          {/* Welcome text */}
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <h1 className="mb-4 text-2xl font-semibold text-gray-900">
              Welcome to the NYSDOT Transportation Screen Builder!
            </h1>
            <p className="text-gray-600">
              Through this tool, you will be able to create your own transportation slide show, publish the slide show
              and display it through a public URL that you publish.
            </p>
          </div>

          {/* Create section */}
          <div
            className="mx-auto mb-8 w-full max-w-3xl rounded-lg p-8 text-white"
            style={{ backgroundColor: "#0B5583" }}
          >
            <h2 className="mb-6 text-center text-3xl font-bold">Create a Transportation Slide Show</h2>

            <div className="mb-6 space-y-1 text-center text-white/90">
              <p>1. Set an initial central location for the screens</p>
              <p>2. Select a template from the drop-down list to get started with your first screen.</p>
            </div>

            {/* Location input + Set button */}
            <div className="flex flex-col items-end justify-center gap-4 sm:flex-row">
              <Input placeholder="Enter location…" className="h-10 max-w-md flex-1 border-0 bg-white text-gray-900" />
              <Button className="h-10 px-6 font-semibold text-black" style={{ backgroundColor: "#FACE00" }} onClick={() => router.push('/editor')}>
                Set
              </Button>
            </div>

            {/* Template select */}
            <div className="mt-4 flex justify-center">
              <Select>
                <SelectTrigger className="h-10 w-full max-w-md border-0 bg-white text-gray-900">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Select a Template" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="template1">Basic Transportation Template</SelectItem>
                  <SelectItem value="template2">Highway Information Template</SelectItem>
                  <SelectItem value="template3">Traffic Alert Template</SelectItem>
                  <SelectItem value="template4">Construction Update Template</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Edit section */}
          <div className="mx-auto w-full max-w-3xl rounded-lg p-8" style={{ backgroundColor: "#6E9AB5" }}>
            <h2 className="mb-4 text-center text-3xl font-bold text-white">Edit an Transportation Slide Show</h2>
            <p className="mb-6 text-center text-white/90">Input a published Transportation Slide Show URL to edit</p>

            <div className="flex flex-col items-end justify-center gap-4 sm:flex-row">
              <Input
                placeholder="Enter published URL…"
                className="h-10 max-w-md flex-1 border-gray-300 bg-white text-gray-900"
              />
              <Button className="h-10 px-6 font-semibold text-black" style={{ backgroundColor: "#FACE00" }}>
                Edit
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
