import type { SVGProps } from "react";
import { approximateCardinalDirections } from "./registration";

const directions = approximateCardinalDirections();
const labels = ["U", "T", "S", "B"] as const;

export function CompassRose(props: SVGProps<SVGSVGElement>) {
  const north = directions.U;
  const tip = [50 + north[0] * 27, 50 + north[1] * 27];
  const left = [50 - north[1] * 6, 50 + north[0] * 6];
  const right = [50 + north[1] * 6, 50 - north[0] * 6];
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label="Arah mata angin perkiraan: utara, timur, selatan, barat" {...props}>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#aab8ab" strokeWidth="1" />
      {labels.map((label) => {
        const [dx, dy] = directions[label];
        return <g key={label}>
          <line x1="50" y1="50" x2={50 + dx * 24} y2={50 + dy * 24} stroke="#60766a" strokeWidth="1.3" />
          <text x={50 + dx * 41} y={50 + dy * 41} textAnchor="middle" dominantBaseline="central" fill={label === "U" ? "#9d3d2d" : "#183f35"} fontSize="13" fontWeight="700">{label}</text>
        </g>;
      })}
      <path d={`M${tip.join(" ")}L${left.join(" ")}L${right.join(" ")}Z`} fill="#b64632" />
      <circle cx="50" cy="50" r="3" fill="#183f35" />
    </svg>
  );
}
