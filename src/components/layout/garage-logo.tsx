import Image from "next/image";
import logo from "@/public/logo.png";

export function GarageLogo({ preload = false }: { preload?: boolean }) {
  return (
    <Image
      src={logo}
      alt="The Garage home"
      className="garage-logo"
      sizes="(max-width: 760px) 160px, 200px"
      preload={preload}
    />
  );
}
