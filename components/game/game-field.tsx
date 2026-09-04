// components/game/game-field.tsx
'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { CatDisplay } from './CatDisplay';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface GameFieldProps {
  emotion: string;
  energy: number;
  onTap: (x: number, y: number) => void;
  catModel: string;
  catInfo: { name: string; emoji: string; text: string };
  isSuperhero: boolean;
}

// ✅ Встроенный компонент эффекта клика
function ClickEffect({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    setScale(1);
    const timer = setTimeout(() => {
      setOpacity(0);
      setScale(1.5);
      setTimeout(onComplete, 300);
    }, 500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: x - 20,
        top: y - 20,
        opacity,
        transform: `scale(${scale})`,
        transition: 'all 0.3s ease-out',
      }}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl animate-pulse" />
        <Sparkles className="w-10 h-10 text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white whitespace-nowrap drop-shadow-lg">
          +10 ⚡
        </span>
      </div>
    </div>
  );
}

export function GameField({
  emotion,
  energy,
  onTap,
  catModel,
  isSuperhero,
}: GameFieldProps) {
  const [effects, setEffects] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);

  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (energy <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const id = Date.now();
    setEffects(prev => [...prev, { id, x, y }]);
    
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);

    onTap(e.clientX, e.clientY);
  }, [energy, onTap]);

  const removeEffect = useCallback((id: number) => {
    setEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <div
      onClick={handleTap}
      className="w-full h-full relative cursor-pointer select-none overflow-hidden"
    >
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ 
            antialias: true, 
            preserveDrawingBuffer: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, 5, 5]} intensity={0.5} />
          <pointLight position={[0, -3, 2]} intensity={0.3} color="#8b5cf6" />
          
          <Environment preset="studio" background={false} />
          
          <Suspense fallback={null}>
            <CatDisplay url={catModel} scale={1.2} />
          </Suspense>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2.4}
            maxPolarAngle={Math.PI / 2}
            rotateSpeed={0.3}
          />
        </Canvas>
      </div>

      {/* Эффект пульсации */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-all duration-300",
        isPulsing && "bg-purple-500/5"
      )} />

      {/* Аура */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className={cn(
          "w-64 h-64 rounded-full blur-3xl transition-all duration-1000",
          isSuperhero 
            ? "bg-amber-400/20 animate-pulse" 
            : "bg-purple-500/30"
        )} />
      </div>

      {/* Бейдж супергероя */}
      {isSuperhero && (
        <div className="absolute top-3 left-3 pointer-events-none bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-xl text-[10px] font-bold tracking-wider animate-pulse backdrop-blur-sm">
          ⚡ СУПЕРСИЛА
        </div>
      )}

      {/* Индикатор энергии */}
      {energy <= 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs font-bold animate-pulse backdrop-blur-sm">
          ⚡ Нет энергии! Купи в магазине
        </div>
      )}

      {/* Эффекты кликов */}
      {effects.map(({ id, x, y }) => (
        <ClickEffect
          key={id}
          x={x}
          y={y}
          onComplete={() => removeEffect(id)}
        />
      ))}
    </div>
  );
}