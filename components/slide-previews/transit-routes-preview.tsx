export default function TransitRoutesPreview() {
  return (
    <>
      <div
        className="bg-[#f7fafc] border border-[#e2e8f0] rounded-lg p-4 mb-6 relative"
        style={{ height: "500px" }}
      >
        <img
          src="/images/main-map.png"
          alt="Albany area transit map"
          className="w-full h-full object-cover rounded"
        />

        {/* Map Footer Overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-[#F4F4F4] p-3 rounded">
          <div className="flex items-center justify-between">
            <img
              src="/images/statewide-mobility-services.png"
              alt="Statewide Mobility Services"
              className="h-[25px] w-[246px]"
            />
            <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
          </div>
        </div>
      </div>
    </>
  )
}