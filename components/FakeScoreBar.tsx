interface Props {
  probability: number
}

export default function FakeScoreBar({ probability }: Props) {
  const color = probability > 50 ? 'bg-red-500' : probability > 25 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Fake Review Probability</h2>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className={`h-4 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${probability}%` }}
        ></div>
      </div>
      <p className="mt-2 text-gray-600">{probability}% chance of fake reviews</p>
    </div>
  )
}