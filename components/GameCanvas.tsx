"use client";

import { useEffect, useRef} from "react";

import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "@/game/apartment";

export default function GameCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let game: InstanceType<typeof import("phaser").Game> | undefined;
        let releaseKeyboard: (() => void) | undefined;
        let cancelled = false;

        (async () => {
          const [{ Game, AUTO }, { ApartmentScene }, { pauseGameKeysWhileTyping }] =
            await Promise.all([
              import("phaser"),
              import("@/game/ApartmentScene"),
              import("@/game/keyboardFocus"),
            ]);

          if (cancelled || !containerRef.current) return;

          game = new Game({
            type: AUTO,
            parent: containerRef.current,
            width: MAP_WIDTH * TILE_SIZE,
            height: MAP_HEIGHT * TILE_SIZE,
            backgroundColor: "#111111",
            scene: [ApartmentScene],
          });

          // Slipper tastaturet fri når du skriver i et skjemafelt.
          releaseKeyboard = pauseGameKeysWhileTyping(game);
        })();

        return () => {
          cancelled = true;
          releaseKeyboard?.();
          game?.destroy(true);
        };
      }, []);

    return <div ref={containerRef} />;
    }
