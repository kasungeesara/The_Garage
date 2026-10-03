import type { CSSProperties } from "react";
const paths: Record<string, string> = {
  search: "m21 21-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  arrow: "M4 12h16 m-6-6 6 6-6 6",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  box: "m12 2 10 5v10l-10 5-10-5V7z M2 7l10 5 10-5 M12 12v10",
  user: "M20 21v-2a7 7 0 0 0-14 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  chat: "M21 11a9 9 0 0 1-9 9H3l1-5a9 9 0 1 1 17-4Z M8 10h8 M8 14h5",
  bell: "M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10 M10 22h4",
  shield: "m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6z m-5 10 3 3 7-7",
  chart: "M4 20V10 M10 20V4 M16 20v-8 M22 20V7",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2",
  star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2",
  plus: "M12 5v14 M5 12h14",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  news: "M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h3 M8 18h8",
  logout: "M9 3H3v18h6 M9 12h12 m-5-5 5 5-5 5",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  check: "m5 12 4 4L19 6",
  filter: "M4 6h16 M7 12h10 M10 18h4",
  upload: "M12 16V3 m-5 5 5-5 5 5 M4 15v6h16v-6",
};
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name] || paths.box} />
    </svg>
  );
}
