export default function QRSlidePreview() {
  return (
    <>
    
      {/* QR Code Display Area */}
      <div className="mb-6">
        <div
          className="bg-[#192f51] text-white rounded-lg overflow-hidden relative flex flex-col items-center justify-center"
          style={{ height: "500px" }}
        >
          {/* QR Code */}
          <div className="bg-white p-6 rounded-lg mb-6">
            <div className="w-48 h-48 bg-white flex items-center justify-center">
              <img src="/placeholder.svg?height=192&width=192" alt="QR Code" className="w-full h-full" />
            </div>
          </div>

          {/* Text below QR Code */}
          <div className="text-2xl font-medium">See this on your phone!</div>
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

    </>

  )
}