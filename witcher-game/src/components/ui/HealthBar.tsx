interface HealthBarProps {
  currentHealth: number;
  maxHealth: number;
  label?: string;
}

export function HealthBar({ currentHealth, maxHealth, label }: HealthBarProps) {
  const healthPercentage = Math.max(
    0,
    Math.min(100, (currentHealth / maxHealth) * 100)
  );

  // Determine color based on health percentage
  const getHealthColor = () => {
    if (healthPercentage > 50) return "#4CAF50"; // Green
    if (healthPercentage > 25) return "#FFEB3B"; // Yellow
    return "#F44336"; // Red
  };

  return (
    <div className="flex flex-col w-full max-w-xs">
      {label && (
        <div className="flex justify-between text-white mb-1">
          <span>{label}</span>
          <span>{`${currentHealth}/${maxHealth}`}</span>
        </div>
      )}
      <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${healthPercentage}%`,
            backgroundColor: getHealthColor(),
          }}
        />
      </div>
    </div>
  );
}
