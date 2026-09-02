// components/game/game-field.tsx
'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'

interface GameFieldProps {
  emotion: string
  energy: number
  onTap: (x: number, y: number) => void
  catModel: string
  catInfo: { name: string; emoji: string; text: string }
  isSuperhero: boolean
}

// Легковесный компонент рендеринга статичной 3D-сетки кота
function StaticModel({ url, emotion }: { url: string; emotion: string }) {
  const { scene } = useGLTF(url)
  const modelRef = useRef<THREE.Group>(null)

  // Математический расчет покачивания и прыжка статичной сетки кота
  useFrame((state) => {
    if (!modelRef.current) return

    if (emotion === 'joy') {
      // Быстрый, задорный прыжок вверх при тапе
      modelRef.current.position.y = Math.max(
        0,
        Math.sin(state.clock.getElapsedTime() * 15) * 0.3,
      )
      modelRef.current.scale.setScalar(
        THREE.MathUtils.lerp(modelRef.current.scale.x, 1.08, 0.2),
      )
    } else {
      // Естественное плавное покачивание (эффект живого дыхания в покое)
      modelRef.current.position.y =
        Math.sin(state.clock.getElapsedTime() * 2) * 0.02
      modelRef.current.scale.setScalar(
        THREE.MathUtils.lerp(modelRef.current.scale.x, 1.0, 0.1),
      )
    }
  })

  return (
    <primitive
      ref={modelRef}
      object={scene}
    />
  )
}

export function GameField({
  emotion,
  energy,
  onTap,
  catModel,
  isSuperhero,
}: GameFieldProps) {
  const handleTouch = (e: React.MouseEvent<HTMLDivElement>) => {
    if (energy <= 0) return
    onTap(e.clientX, e.clientY) // Отправляем координаты тапа для вылетающих цифр
  }

  return (
    <div
      onClick={handleTouch}
      className="w-full h-full relative cursor-pointer select-none"
    >
      {/* 3D WebGL Холст */}
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 45 }}
      >
        {/* 🔥 ИСПРАВЛЕНО: Убрали Stage, добавили Environment с preset */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} />
        
        {/* Встроенное окружение без HDR файла */}
        <Environment preset="studio" background={false} />
        
        <Suspense fallback={null}>
          <StaticModel
            url={catModel}
            emotion={emotion}
          />
        </Suspense>

        {/* OrbitControls позволяет игроку крутить статичную 3D-модельку пальцем */}
        <OrbitControls
          enableZoom={false} // Запрещаем приближение
          enablePan={false} // Запрещаем сдвиг камеры в сторону
          minPolarAngle={Math.PI / 2.4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* Эффект неоновой ауры за котом */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
        <div
          className={`w-72 h-72 rounded-full blur-3xl opacity-20 transition-colors duration-500 ${
            isSuperhero ? 'bg-amber-400 animate-pulse' : 'bg-purple-500/40'
          }`}
        />
      </div>

      {/* Бейдж режима супергероя */}
      {isSuperhero && (
        <div className="absolute top-4 left-4 pointer-events-none bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-xl text-[10px] font-mono font-bold tracking-wider animate-pulse">
          ⚡ СУПЕРСИЛА АКТИВНА
        </div>
      )}
    </div>
  )
}

// Заранее кэшируем .glb файлы в память, чтобы переключение на 50 тапах происходило моментально
useGLTF.preload('/assets/models/cat.glb')
useGLTF.preload('/assets/models/cat_superhero.glb')