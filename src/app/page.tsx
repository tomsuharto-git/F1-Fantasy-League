export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          🏎️ F1 Fantasy League
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Real-time fantasy racing with friends
        </p>
        
        <div className="space-y-4">
          <a
            href="/create"
            className="block w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
          >
            Create New League
          </a>
          
          <div className="text-gray-400 text-sm">
            or join via share link
          </div>
        </div>
        
        <div className="mt-12 p-6 bg-gray-800 rounded-lg text-left">
          <h2 className="text-lg font-bold mb-3">How it works:</h2>
          <ol className="space-y-2 text-gray-300">
            <li>1. Create a league and share the link with friends</li>
            <li>2. Draft drivers from the starting grid (snake draft)</li>
            <li>3. Score points during the race based on position changes</li>
            <li>4. Winner gets bragging rights! 🏆</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
