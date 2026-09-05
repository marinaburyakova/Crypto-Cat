// components/game/game-field.tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

interface GameFieldProps {
  emotion: string
  energy: number
  onTap: (x: number, y: number) => void
  catModel: string
  catInfo: { name: string; emoji: string; text: string }
  isSuperhero: boolean
  isLegendary?: boolean
}

export function GameField({
  emotion,
  energy,
  onTap,
  catModel,
  isSuperhero,
  isLegendary = false,
}: GameFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  
  // 🔥 Анимация клика (конфетти и +10)
  const [clickEffects, setClickEffects] = useState<{ 
    id: string; 
    x: number; 
    y: number; 
    type: 'tap' | 'confetti' 
  }[]>([])

  // 🔥 Обработка клика с анимацией
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (energy <= 0) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / rect.width
    const y = 1 - (e.clientY - rect.top) / rect.height

    // 🔥 Добавляем эффект клика (+10 и конфетти)
    const id = `${Date.now()}-${Math.random()}`
    setClickEffects(prev => [...prev, { id, x, y, type: 'tap' }])
    
    // 🔥 Конфетти через 50ms
    setTimeout(() => {
      setClickEffects(prev => [...prev, { id: `${id}-confetti`, x, y, type: 'confetti' }])
    }, 50)

    // Удаляем эффекты через 1 секунду
    setTimeout(() => {
      setClickEffects(prev => prev.filter(e => e.id !== id && e.id !== `${id}-confetti`))
    }, 1000)

    // Вызываем onTap
    onTap(x, y)
  }, [energy, onTap])

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    if (width === 0 || height === 0) return

    // Сцена
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)

    // Камера
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 0.3, 4.5)
    camera.lookAt(0, 0, 0)

    // Рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.5
    container.appendChild(renderer.domElement)

    // Освещение
    const hemiLight = new THREE.HemisphereLight(0x4444ff, 0x444422, 1.0)
    scene.add(hemiLight)

    const mainLight = new THREE.DirectionalLight(0xfff5e6, 2.5)
    mainLight.position.set(5, 8, 5)
    mainLight.castShadow = true
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x8888ff, 1.2)
    fillLight.position.set(-3, 2, 3)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xff8844, 1.2)
    rimLight.position.set(0, 0.5, -5)
    scene.add(rimLight)

    // Пол
    const planeGeo = new THREE.PlaneGeometry(6, 6)
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.3 })
    const plane = new THREE.Mesh(planeGeo, planeMat)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = -0.9
    plane.receiveShadow = true
    scene.add(plane)

    // Группа для модели
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)

    // Целевой угол поворота (плавное вращение)
    let targetRotationY = 0
    let currentRotationY = 0

    // Загрузка модели
    const loader = new GLTFLoader()
    loader.load(
      catModel,
      (gltf) => {
        const model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        model.position.sub(center)
        const targetSize = 2.2
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = maxDim > 0 ? targetSize / maxDim : 1
        model.scale.set(scale, scale, scale)
        model.position.y += 0.1

        modelGroup.add(model)
        setIsReady(true)
      },
      undefined,
      (error) => {
        console.error('❌ Ошибка загрузки модели:', error)
        setIsReady(true)
      }
    )

    // 🔥 Анимация с плавным поворотом к клику
    const animate = () => {
      // Плавное вращение к цели
      const diff = targetRotationY - currentRotationY
      if (Math.abs(diff) > 0.001) {
        currentRotationY += diff * 0.08 // Плавность поворота
      } else {
        currentRotationY = targetRotationY
      }
      
      modelGroup.rotation.y = currentRotationY
      
      // Лёгкое покачивание
      modelGroup.position.y = 0.1 + Math.sin(Date.now() * 0.001) * 0.02
      
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    animate()

    // 🔥 Обновление цели поворота при клике
    const handleClick3D = (x: number, y: number) => {
      // Преобразуем координаты клика в угол
      const angle = Math.atan2(x - 0.5, y - 0.5)
      targetRotationY = angle
    }

    // Слушаем клики через DOM
    const clickListener = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = 1 - (e.clientY - rect.top) / rect.height
      handleClick3D(x, y)
    }

    container.addEventListener('click', clickListener)

    // Resize
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w > 0 && h > 0) {
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      container.removeEventListener('click', clickListener)
      window.removeEventListener('resize', handleResize)
      container.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [catModel])

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="w-full h-full absolute inset-0 cursor-pointer select-none overflow-hidden"
    >
      {/* Аура */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className={`w-72 h-72 rounded-full blur-3xl transition-all duration-1000 ${
          isLegendary 
            ? 'bg-yellow-400/30 animate-pulse' 
            : isSuperhero 
              ? 'bg-amber-400/25 animate-pulse' 
              : 'bg-purple-500/20'
        }`} />
      </div>

      {/* 🔥 Эффекты клика (+10 и конфетти) */}
      {clickEffects.map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${effect.x * 100}%`,
            top: `${(1 - effect.y) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {effect.type === 'tap' ? (
            // 🔥 +10 с анимацией
            <div className="text-2xl font-bold text-yellow-400 animate-float-up">
              +10 ✨
            </div>
          ) : (
            // 🔥 Конфетти
            <div className="flex gap-1 animate-confetti">
              {['🌟', '⭐', '✨', '💫', '🎉'].map((emoji, i) => (
                <span
                  key={i}
                  className="text-xl animate-confetti-piece"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    transform: `rotate(${i * 30}deg)`,
                  }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Бейджи */}
      {isLegendary && (
        <div className="absolute top-3 left-3 pointer-events-none bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded-xl text-[10px] font-bold tracking-wider animate-pulse backdrop-blur-sm z-10">
          👑 ЛЕГЕНДА
        </div>
      )}

      {isSuperhero && !isLegendary && (
        <div className="absolute top-3 left-3 pointer-events-none bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-xl text-[10px] font-bold tracking-wider animate-pulse backdrop-blur-sm z-10">
          ⚡ СУПЕРСИЛА
        </div>
      )}

      {energy <= 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs font-bold animate-pulse backdrop-blur-sm z-10">
          ⚡ Нет энергии! Купи в магазине
        </div>
      )}

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400 text-xs">Загрузка кота...</span>
          </div>
        </div>
      )}
    </div>
  )
}