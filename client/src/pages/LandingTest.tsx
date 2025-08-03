export default function LandingTest() {
  console.log("🧪 LandingTest component rendering...");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-pink-900 text-white flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-6xl font-black mb-6">
          <span className="bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
            AURA
          </span>
        </h1>
        <p className="text-xl mb-8">Build your legendary status</p>
        <button 
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform"
          onClick={() => alert('Test button clicked!')}
        >
          GET AURA NOW
        </button>
      </div>
    </div>
  );
}