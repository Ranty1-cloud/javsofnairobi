export default function Loading() { return <div className="wrap"><div className="grid">{[0, 1, 2].map(i => <div key={i} className="skeleton" />)}</div></div>; }
