export default function Template1Preview({slideId}: {slideId: string}) {
  return (
    <div className="w-full h-[550px] flex flex-col justify-between bg-[#192f51] text-white rounded-lg overflow-hidden mb-6">       
      <div
        className="bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] text-white rounded-lg overflow-hidden relative"
        style={{ height: "500px" }}
      >
        {/* Title Area */}
        <div className="p-6 border-b border-white/20">
          <div className="w-full border-2 border-[#11d1f7] rounded px-4 py-2">
            <div className="text-4xl font-light">Type Title Here</div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 flex gap-4">
          {/* Left Content Box (60%) */}
          <div className="w-[60%]">
            <div className="h-full border-2 border-[#11d1f7] rounded-lg bg-[#11d1f7]/10 p-6 flex items-start">
              <div className="text-2xl font-light">Type text here</div>
            </div>
          </div>

          {/* Right Image Box (40%) */}
          <div className="w-[40%]">
            <div className="h-full border-2 border-[#11d1f7] rounded-lg bg-[#11d1f7]/10 flex flex-col items-center justify-center p-6">
              <div className="text-center">
                <div className="text-lg mb-4">Drag and Drop Image Here</div>
                <div className="text-sm text-white/80 mb-6">accepted files: .png, .jpg, .gif</div>

                <img
                  src="/images/placeholder-image.png"
                  alt="Placeholder image"
                  className="max-w-32 max-h-24 object-contain mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#F4F4F4] p-3 flex items-center justify-between rounded-b-lg">
        <img
          src="/images/statewide-mobility-services.png"
          alt="Statewide Mobility Services"
          className="h-[25px] w-[246px]"
        />
        <img src="/images/nysdot-footer-logo.png" alt="NYSDOT" className="h-8" />
      </div>
    </div>
  )
}