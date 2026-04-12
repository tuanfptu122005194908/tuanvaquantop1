import { useEffect, useState, useCallback } from 'react';

interface Petal {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  swaySpeed: number;
  swayAmount: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export const SakuraRain = () => {
  const [petals, setPetals] = useState<Petal[]>([]);

  const updatePetals = useCallback(() => {
    setPetals(prevPetals => 
      prevPetals.map(petal => {
        let newY = petal.y + petal.speed;
        let newX = petal.x + Math.sin(Date.now() / 1000 * petal.swaySpeed) * petal.swayAmount / 100;
        let newRotation = petal.rotation + petal.rotationSpeed;

        if (newY > 100) {
          newY = -10;
          newX = Math.random() * 100;
        }

        return {
          ...petal,
          x: newX,
          y: newY,
          rotation: newRotation
        };
      })
    );
  }, []);

  useEffect(() => {
    const petalCount = 15;
    const newPetals: Petal[] = [];

    for (let i = 0; i < petalCount; i++) {
      newPetals.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100 - 100,
        size: Math.random() * 15 + 10,
        speed: Math.random() * 0.8 + 0.3,
        swaySpeed: Math.random() * 1 + 0.5,
        swayAmount: Math.random() * 20 + 15,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.6 + 0.4
      });
    }

    setPetals(newPetals);

    const interval = setInterval(updatePetals, 50);

    return () => clearInterval(interval);
  }, [updatePetals]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {petals.map(petal => (
        <div
          key={petal.id}
          className="absolute"
          style={{
            left: `${petal.x}%`,
            top: `${petal.y}%`,
            transform: `rotate(${petal.rotation}deg)`,
            opacity: petal.opacity
          }}
        >
          <svg
            width={petal.size}
            height={petal.size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z"
              fill="url(#sakura-gradient)"
              opacity="0.8"
            />
            <defs>
              <linearGradient id="sakura-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB7C5" />
                <stop offset="50%" stopColor="#FFC0CB" />
                <stop offset="100%" stopColor="#FFD1DC" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}
    </div>
  );
};
