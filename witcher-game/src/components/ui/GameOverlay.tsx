import { HealthBar } from "./HealthBar";
import { GameState } from "@/types/game";

interface GameOverlayProps {
  gameState: GameState;
  onRestart: () => void;
}

export function GameOverlay({ gameState, onRestart }: GameOverlayProps) {
  const { playerHealth, isGameActive, score } = gameState;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top bar with health and score */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
        <HealthBar
          currentHealth={playerHealth}
          maxHealth={100}
          label="Witcher"
        />

        <div className="bg-black/70 p-2 rounded text-white">
          <span className="text-lg font-bold">Score: {score}</span>
        </div>
      </div>

      {/* Game over screen */}
      {!isGameActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center bg-gray-900 p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-red-500 mb-4">You Died</h2>
            <p className="text-white mb-4">
              Final Score: <span className="font-bold">{score}</span>
            </p>
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded pointer-events-auto transition"
              onClick={onRestart}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-black/70 p-3 rounded text-white text-sm">
        <div className="mb-1">WASD: Move</div>
        <div className="mb-1">Left Click: Attack</div>
        <div>Right Click: Block</div>
      </div>
    </div>
  );
}
