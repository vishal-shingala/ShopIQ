interface Props {
  verdict: string
}

export default function VerdictBox({ verdict }: Props) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-blue-800 mb-2">Verdict</h2>
      <p className="text-blue-700">{verdict}</p>
    </div>
  )
}