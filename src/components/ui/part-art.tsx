import { useId } from "react";
export function PartArt({
  category = "Brakes",
  className = "",
}: {
  category?: string;
  className?: string;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className={`part-art ${className}`}
      viewBox="0 0 400 280"
      role="img"
      aria-label={`${category} component illustration`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e1e7ea" />
          <stop offset=".4" stopColor="#91a2ae" />
          <stop offset="1" stopColor="#293e4e" />
        </linearGradient>
        <linearGradient id={`${id}b`}>
          <stop stopColor="#233949" />
          <stop offset=".5" stopColor="#526b7b" />
          <stop offset="1" stopColor="#112b3c" />
        </linearGradient>
      </defs>
      <ellipse cx="205" cy="235" rx="110" ry="13" fill="#061b2d" opacity=".1" />
      {category === "Brakes" ? (
        <g transform="translate(200 135) rotate(-24)">
          <ellipse rx="95" ry="97" fill={`url(#${id}b)`} />
          <ellipse
            cx="-10"
            cy="-5"
            rx="92"
            ry="95"
            fill={`url(#${id})`}
            stroke="#cbd4d9"
            strokeWidth="2"
          />
          <ellipse
            cx="-10"
            cy="-5"
            rx="67"
            ry="70"
            fill="none"
            stroke="#536a78"
            strokeWidth="1.5"
          />
          <ellipse
            cx="-10"
            cy="-5"
            rx="57"
            ry="60"
            fill="none"
            stroke="#bac6cd"
            strokeWidth="1"
          />
          <ellipse
            cx="-10"
            cy="-5"
            rx="28"
            ry="31"
            fill="#193343"
            stroke="#c7d1d8"
            strokeWidth="9"
          />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <g key={a} transform={`rotate(${a} -10 -5)`}>
              <circle cx="-10" cy="-49" r="5" fill="#304958" />
              <path
                d="M5-85 20-69 M36-72 48-55"
                stroke="#5d737f"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          ))}
          <path
            d="M53-58q65 4 62 45v72q-30 20-62 0l-8-55z"
            fill="#dfb431"
            stroke="#e9c65a"
            strokeWidth="3"
          />
          <path
            d="M67-30h33 M67-16h33 M67-2h33"
            stroke="#ad861e"
            strokeWidth="4"
          />
          <path d="M64 19h41v24H64z" fill="#263d4c" />
        </g>
      ) : category === "Lighting" ? (
        <g transform="rotate(-10 200 140)">
          <path
            d="M75 92q35-27 175-13l77 92-27 34H103l-34-58z"
            fill={`url(#${id}b)`}
            stroke="#142e3f"
            strokeWidth="6"
          />
          <path
            d="M90 101q50-20 151-9l65 78-18 20H112l-28-49z"
            fill={`url(#${id})`}
            stroke="#c8d9e5"
            strokeWidth="3"
          />
          <circle
            cx="162"
            cy="139"
            r="40"
            fill="#284454"
            stroke="#c6dce8"
            strokeWidth="7"
          />
          <circle cx="162" cy="139" r="24" fill="#b6d9e9" />
          <path d="m227 110 43 49h-50z" fill="#d9e9f1" />
          <path d="M103 176h180" stroke="#fff3b2" strokeWidth="7" />
        </g>
      ) : category === "Engine" ? (
        <g transform="rotate(-18 200 140)">
          <path
            d="M110 62h155l27 158H87z"
            fill="#263e4e"
            stroke="#102a3b"
            strokeWidth="7"
          />
          <path d="M123 77h130l22 126H104z" fill="#d5b978" />
          {Array.from({ length: 11 }, (_, i) => (
            <path
              key={i}
              d={`M${127 + i * 11} 82 ${111 + i * 15} 198`}
              stroke="#937947"
              strokeWidth="4"
            />
          ))}
          <path d="M112 64h151 M92 217h196" stroke="#506979" strokeWidth="7" />
        </g>
      ) : category === "Suspension" ? (
        <g transform="rotate(27 200 140)">
          <path d="M190 37h20v170h-20z" fill={`url(#${id})`} />
          <path d="M180 171h40v73h-40z" fill="#c4a431" />
          <path d="M171 65h58 M171 173h58" stroke="#1d3749" strokeWidth="10" />
          {Array.from({ length: 7 }, (_, i) => (
            <path
              key={i}
              d={`M174 ${75 + i * 13}q-15-11 26-11t26 11l-52 8`}
              fill="none"
              stroke="#4d6573"
              strokeWidth="8"
            />
          ))}
          <path d="M175 242h50 M186 36h28" stroke="#253e4e" strokeWidth="9" />
        </g>
      ) : category === "Electrical" ? (
        <g>
          <path
            d="M108 90h158l31 38v64l-30 28H113l-20-41v-56z"
            fill={`url(#${id})`}
            stroke="#566d7c"
            strokeWidth="4"
          />
          <ellipse
            cx="140"
            cy="151"
            rx="53"
            ry="67"
            fill="#78909e"
            stroke="#c0cdd4"
            strokeWidth="5"
          />
          <ellipse cx="140" cy="151" rx="36" ry="48" fill="#213c4d" />
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d="m140 91 4 22"
              stroke="#294655"
              strokeWidth="6"
              transform={`rotate(${i * 45} 140 151)`}
            />
          ))}
          <ellipse cx="140" cy="151" rx="18" ry="26" fill="#a5b8c4" />
          <path
            d="M215 100v98 M235 102v95 M255 110v84"
            stroke="#314d5e"
            strokeWidth="8"
          />
          <path d="m204 84 2-20h29l7 22" fill="#183648" />
        </g>
      ) : (
        <g transform="rotate(-10 200 140)">
          <path
            d="M87 95q96-75 198 4l22 69q-88 63-199 15z"
            fill={`url(#${id}b)`}
            stroke="#203b4b"
            strokeWidth="5"
          />
          <path
            d="M105 103q86-52 166 5l14 47q-79 46-169 11z"
            fill={`url(#${id})`}
            stroke="#b5c9d6"
            strokeWidth="3"
          />
          <path d="m282 162 43 24-6 34-35-16-15-26" fill="#203b4c" />
          <path
            d="m115 126 141-2"
            stroke="#d2e2eb"
            strokeWidth="2"
            opacity=".6"
          />
        </g>
      )}
    </svg>
  );
}
