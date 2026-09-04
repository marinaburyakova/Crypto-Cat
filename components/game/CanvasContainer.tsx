// components/game/CanvasContainer.tsx
'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, OrbitControls, Environment } from '@react-three/drei';
import { CatMesh } from './CatMesh';
import { ErrorBoundary } from 'react-error-boundary';

interface CanvasContainerProps {
  onVisualClick?: (x: number, y: number) => void;
  className?: string;
  enableOrbitControls?: boolean;
  autoRotate?: boolean;
}

// Компонент-заглушка при ошибке
const CanvasErrorFallback = () => (
  <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded-3xl">
    <div className="text-center text-slate-400">
      <svg 
        className="w-12 h-12 mx-auto mb-2 text-slate-500" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
        />
      </svg>
      <p className="text-sm">Не удалось загрузить 3D модель</p>
      <p className="text-xs text-slate-500 mt-1">Попробуйте обновить страницу</p>
    </div>
  </div>
);

// Компонент-загрузка
const CanvasLoader = () => (
  <div className="w-full h-full flex items-center justify-center bg-slate-800/30 rounded-3xl">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl">🐱</span>
      </div>
    </div>
  </div>
);

export function CanvasContainer({ 
  onVisualClick, 
  className = '',
  enableOrbitControls = true,
  autoRotate = true,
}: CanvasContainerProps) {
  // Мемоизируем конфигурацию камеры
  const cameraConfig = useMemo(() => ({
    position: [0, 0, 5] as [number, number, number],
    fov: 45,
  }), []);

  // Мемоизируем конфигурацию освещения
  const lightingConfig = useMemo(() => ({
    ambientIntensity: 0.7,
    directionalPosition: [5, 10, 5] as [number, number, number],
    directionalIntensity: 0.5,
    pointPosition: [-5, 5, -3] as [number, number, number],
    pointIntensity: 0.5,
  }), []);

  return (
    <div className={`
      w-full h-[50vh] min-h-[350px] 
      relative 
      bg-gradient-to-b from-zinc-800 to-zinc-950 
      rounded-3xl overflow-hidden 
      shadow-inner border border-zinc-800
      ${className}
    `}>
      <ErrorBoundary FallbackComponent={CanvasErrorFallback}>
        <Suspense fallback={<CanvasLoader />}>
          <Canvas
            shadows
            camera={cameraConfig}
            gl={{ 
              antialias: true, 
              preserveDrawingBuffer: true,
              alpha: false,
              powerPreference: "high-performance",
            }}
            dpr={[1, 2]} // Адаптивный DPR для производительности
          >
            {/* Освещение сцены */}
            <ambientLight intensity={lightingConfig.ambientIntensity} />
            <directionalLight 
              position={lightingConfig.directionalPosition} 
              intensity={lightingConfig.directionalIntensity} 
              castShadow 
              shadow-mapSize={[1024, 1024]}
            />
            <pointLight 
              position={lightingConfig.pointPosition} 
              intensity={lightingConfig.pointIntensity} 
            />
            
            {/* Окружение для мягкого освещения */}
            <Environment preset="studio" />

            {/* Основная модель */}
            <Center>
              <CatMesh 
                onVisualClick={onVisualClick} 
                autoRotate={autoRotate}
              />
            </Center>

            {/* Управление камерой */}
            {enableOrbitControls && (
              <OrbitControls 
                enableZoom={false} 
                enablePan={false}
                minPolarAngle={Math.PI / 3} 
                maxPolarAngle={Math.PI / 2}
                rotateSpeed={0.5}
              />
            )}
          </Canvas>
        </Suspense>
      </ErrorBoundary>

      {/* Декоративный градиент */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-zinc-950/30 to-transparent pointer-events-none" />
      
      {/* Индикатор взаимодействия */}
      {onVisualClick && (
        <div className="absolute bottom-4 left-4 text-[10px] text-slate-500 pointer-events-none opacity-50">
          🖱️ Кликните по коту для взаимодействия
        </div>
      )}
    </div>
  );
}