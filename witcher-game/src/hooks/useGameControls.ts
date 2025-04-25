import { useEffect, useState } from "react";
import { GameControls } from "@/types/game";

export const useGameControls = () => {
  const [controls, setControls] = useState<GameControls>({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    attack: false,
    block: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          setControls((prev) => ({ ...prev, moveForward: true }));
          break;
        case "KeyS":
          setControls((prev) => ({ ...prev, moveBackward: true }));
          break;
        case "KeyA":
          setControls((prev) => ({ ...prev, moveLeft: true }));
          break;
        case "KeyD":
          setControls((prev) => ({ ...prev, moveRight: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          setControls((prev) => ({ ...prev, moveForward: false }));
          break;
        case "KeyS":
          setControls((prev) => ({ ...prev, moveBackward: false }));
          break;
        case "KeyA":
          setControls((prev) => ({ ...prev, moveLeft: false }));
          break;
        case "KeyD":
          setControls((prev) => ({ ...prev, moveRight: false }));
          break;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      if (e.button === 0) {
        // Left mouse button
        setControls((prev) => ({ ...prev, attack: true }));
      } else if (e.button === 2) {
        // Right mouse button
        setControls((prev) => ({ ...prev, block: true }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      if (e.button === 0) {
        // Left mouse button
        setControls((prev) => ({ ...prev, attack: false }));
      } else if (e.button === 2) {
        // Right mouse button
        setControls((prev) => ({ ...prev, block: false }));
      }
    };

    // Prevent context menu on right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return controls;
};
