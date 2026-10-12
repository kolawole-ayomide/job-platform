// Tiny inline sparkline - just a polyline through real daily counts (last 7
// days). Renders a flat middle line rather than a jagged/misleading shape
// when every value is 0, since a flat "nothing happened" line is the
// honest picture, not an invented wiggle.
export function Sparkline({ data = [], color = "#2947C9", width = 72, height = 24 }) {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}