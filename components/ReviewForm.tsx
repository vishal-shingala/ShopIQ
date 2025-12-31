'use client'

import { useState } from 'react'

interface FormData {
  productName: string
  price: number
  reviews: string
}

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

interface Props {
  onAnalysis: (result: AnalysisResult) => void
}

export default function ReviewForm({ onAnalysis }: Props) {
  const [formData, setFormData] = useState<FormData>({ productName: '', price: 0, reviews: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.productName.trim()) {
      setError('Product name is required')
      return
    }
    if (formData.price <= 0) {
      setError('Price must be greater than 0')
      return
    }
    if (!formData.reviews.trim()) {
      setError('Reviews are required')
      return
    }
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/analyze-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (data.success) {
        onAnalysis(data.data)
      } else {
        setError(data.error || 'Analysis failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Name</label>
        <input
          type="text"
          value={formData.productName}
          onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Price</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          min="0.01"
          step="0.01"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Reviews</label>
        <textarea
          value={formData.reviews}
          onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
          rows={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Paste multiple reviews here, one per line or separated by commas"
          required
        />
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze Reviews'}
      </button>
    </form>
  )
}