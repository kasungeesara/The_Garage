"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./beetle-exploded.module.css";

export function BeetleExploded() {
  const [paused, setPaused] = useState(false);

  return (
    <div className={styles.scene} data-paused={paused}>
      <div className={styles.caption}>
        <span /> THE CLASSIC, PIECE BY PIECE
      </div>
      <div className={styles.stage}>
        <div className={styles.halo} aria-hidden="true" />
        <div className={styles.render}>
          <Image
            src="/beetle-exploded-render.png"
            alt="Realistic yellow classic Volkswagen Beetle in exploded view, with the body lifted above its chassis and detached wheels"
            fill
            sizes="(max-width: 767px) 90vw, (max-width: 1200px) 44vw, 560px"
            preload
            className={styles.image}
          />
        </div>
        <div className={styles.shadow} aria-hidden="true" />
      </div>
      <button
        type="button"
        className={styles.control}
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
        {paused ? "Play animation" : "Pause animation"}
      </button>
    </div>
  );
}
