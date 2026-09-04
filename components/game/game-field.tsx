// components/game/game-field.tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

interface GameFieldProps {
  emotion: string
  energy: number
  onTap: (x: number, y: number) => void
  catModel: string
  catInfo: { name: string; emoji: string; text: string }
  isSuperhero: boolean
  isLegendary?: boolean  // ✅ Добавлено
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
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const catRef = useRef<THREE.Group | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const animationIdRef = useRef<number | null>(null)

  // Инициализация 3D сцены
  useEffect(() => {
    if (!containerRef.current) return

    // Сцена
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Камера
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0, 5)
    cameraRef.current = camera

    // Рендерер
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Орбит контролы
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false
    controls.enablePan = false
    controls.minPolarAngle = Math.PI / 2.4
    controls.maxPolarAngle = Math.PI / 2
    controls.rotateSpeed = 0.3
    controlsRef.current = controls

    // Освещение
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xfff5f0, 0.6)
    mainLight.position.set(4, 6, 4)
    mainLight.castShadow = true
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.25)
    fillLight.position.set(-3, 2, 3)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xff8844, 0.15)
    rimLight.position.set(0, 1, -4)
    scene.add(rimLight)

    const bottomLight = new THREE.PointLight(0x8b5cf6, 0.1)
    bottomLight.position.set(0, -3, 2)
    scene.add(bottomLight)

    // Загрузка модели
    const loader = new GLTFLoader()
    loader.load(
      catModel,
      (gltf: any) => {
        const model = gltf.scene as THREE.Group
        model.scale.set(1.2, 1.2, 1.2)
        catRef.current = model
        scene.add(model)
        console.log('✅ Cat model loaded:', catModel)
      },
      undefined,
      (error: any) => {
        console.error('❌ Failed to load cat model:', error)
        // Создаем заглушку - используем Group вместо Mesh
        const fallback = new THREE.Group()
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshStandardMaterial({ color: 0xff8c00 })
        )
        fallback.add(box)
        catRef.current = fallback
        scene.add(fallback)
        console.log('⚠️ Using fallback model')
      }
    )

    // Анимация
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update()
      }
      if (catRef.current) {
        catRef.current.rotation.y += 0.005
      }
      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }
    animate()

    // Resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      controls.dispose()
    }
  }, [catModel])

  // Обработка клика
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (energy <= 0) return
    onTap(e.clientX, e.clientY)
  }, [energy, onTap])

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="w-full h-full relative cursor-pointer select-none overflow-hidden"
    >
      {/* Аура */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className={`w-64 h-64 rounded-full blur-3xl transition-all duration-1000 ${
          isLegendary 
            ? 'bg-yellow-400/20 animate-pulse' 
            : isSuperhero 
              ? 'bg-amber-400/15 animate-pulse' 
              : 'bg-purple-500/20'
        }`} />
      </div>

      {/* Бейдж легендарного */}
      {isLegendary && (
        <div className="absolute top-3 left-3 pointer-events-none bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded-xl text-[10px] font-bold tracking-wider animate-pulse backdrop-blur-sm">
          👑 ЛЕГЕНДА
        </div>
      )}

      {/* Бейдж супергероя */}
      {isSuperhero && !isLegendary && (
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
    </div>
  )
}