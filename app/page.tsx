import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          ShopIQ
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Detect Fake Reviews. Buy Smarter.
        </p>
        <Link
          href="/analyze"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Analyze Product Reviews
        </Link>
      </div>
    </div>
  )
}