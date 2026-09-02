// components/game/CanvasContainer.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { Center, OrbitControls } from '@react-three/drei';
import { CatMesh } from './CatMesh';

interface CanvasContainerProps {
  onVisualClick: (x: number, y: number) => void;
}

export function CanvasContainer({ onVisualClick }: CanvasContainerProps) {
  return (
    <div className="w-full h-[50vh] min-h-[350px] relative bg-radial from-zinc-800 to-zinc-950 rounded-3xl overflow-hidden shadow-inner border border-zinc-800">
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        {/* Освещение сцены */}
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-5, 5, -3]} intensity={0.5} />

        <Center>
          <CatMesh onVisualClick={onVisualClick} />
        </Center>

        {/* Ограничиваем вращение камеры, чтобы игрок не улетал под текстуры */}
        <OrbitControls 
          enableZoom={false} 
          minPolarAngle={Math.PI / 3} 
          maxPolarAngle={Math.PI / 2} 
        />
      </Canvas>
    </div>
  );
}
