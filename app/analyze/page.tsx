'use client'

import { useState } from 'react'
import ReviewForm from '../../components/ReviewForm'
import ProsCons from '../../components/ProsCons'
import FakeScoreBar from '../../components/FakeScoreBar'
import VerdictBox from '../../components/VerdictBox'
import AlternativeCard from '../../components/AlternativeCard'

interface AnalysisResult {
  pros: string[]
  cons: string[]
  fakeReviewProbability: number
  verdict: string
  alternative?: {
    productName: string
    reason: string
  }
}

export default function AnalyzePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Analyze Product Reviews</h1>
        {!result ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <ReviewForm onAnalysis={setResult} />
          </div>
        ) : (
          <div className="space-y-6">
            <ProsCons pros={result.pros} cons={result.cons} />
            <FakeScoreBar probability={result.fakeReviewProbability} />
            <VerdictBox verdict={result.verdict} />
            {result.alternative && <AlternativeCard alternative={result.alternative} />}
            <button
              onClick={() => setResult(null)}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              Analyze Another Product
            </button>
          </div>
        )}
      </div>
    </div>
  )
}