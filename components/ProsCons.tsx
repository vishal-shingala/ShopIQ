interface Props {
  pros: string[]
  cons: string[]
}

export default function ProsCons({ pros, cons }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-green-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-green-800 mb-2">Pros</h2>
        <ul className="list-disc list-inside text-green-700">
          {pros.map((pro, i) => <li key={i}>{pro}</li>)}
        </ul>
      </div>
      <div className="bg-red-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Cons</h2>
        <ul className="list-disc list-inside text-red-700">
          {cons.map((con, i) => <li key={i}>{con}</li>)}
        </ul>
      </div>
    </div>
  )
}