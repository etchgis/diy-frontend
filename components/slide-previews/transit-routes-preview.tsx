'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY;

export default function TransitRoutesPreview() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-73.7562, 42.6526], 
      zoom: 10,
    })

    return () => map.remove()
  }, [])

  return (
    <div
      className="bg-[#f7fafc] border border-[#e2e8f0] rounded-lg p-4 mb-6 relative"
      style={{ height: '500px' }}
    >
      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded"
        style={{ overflow: 'hidden' }}
      />

      {/* Map Footer Overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-[#F4F4F4] p-3 rounded">
        <div className="flex items-center justify-between">
          <img
            src="/images/statewide-mobility-services.png"
            alt="Statewide Mobility Services"
            className="h-[25px] w-[246px]"
          />
          <img
            src="/images/nysdot-footer-logo.png"
            alt="NYSDOT"
            className="h-8"
          />
        </div>
      </div>
    </div>
  )
}