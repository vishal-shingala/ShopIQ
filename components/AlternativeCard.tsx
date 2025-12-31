interface Alternative {
  productName: string
  reason: string
}

interface Props {
  alternative: Alternative
}

export default function AlternativeCard({ alternative }: Props) {
  return (
    <div className="bg-yellow-50 p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-yellow-800 mb-2">Better Alternative</h2>
      <p className="font-medium text-yellow-900">{alternative.productName}</p>
      <p className="text-yellow-700">{alternative.reason}</p>
    </div>
  )
}