export function DotsLoading() {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          className="h-2 w-2 rounded-lg bg-slate-200"
          style={{ animation: `bounce 1s ease ${idx * 100}ms infinite` }}
        />
      ))}
    </div>
  );
}
