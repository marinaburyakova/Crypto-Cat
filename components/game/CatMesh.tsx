// components/game/CatMesh.tsx
'use client';

import { useGLTF } from '@react-three/drei';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Raycaster, Vector2, Object3D } from 'three';

interface CatMeshProps {
  onVisualClick?: (x: number, y: number) => void;
  autoRotate?: boolean;
  rotationSpeed?: number;
  scale?: number;
}

// ✅ Компонент-заглушка
const FallbackCat = () => (
  <group>
    <mesh>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial color="#ff8c00" emissive="#ff6a00" emissiveIntensity={0.1} />
    </mesh>
    <mesh position={[-0.5, 0.7, 0]} rotation={[0, 0, -0.3]}>
      <coneGeometry args={[0.3, 0.4, 4]} />
      <meshStandardMaterial color="#ff6a00" />
    </mesh>
    <mesh position={[0.5, 0.7, 0]} rotation={[0, 0, 0.3]}>
      <coneGeometry args={[0.3, 0.4, 4]} />
      <meshStandardMaterial color="#ff6a00" />
    </mesh>
    <mesh position={[-0.3, 0.2, 0.6]}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshStandardMaterial color="white" />
    </mesh>
    <mesh position={[0.3, 0.2, 0.6]}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshStandardMaterial color="white" />
    </mesh>
    <mesh position={[0, -0.05, 0.65]}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshStandardMaterial color="#ff6a8a" />
    </mesh>
  </group>
);

export function CatMesh({ 
  onVisualClick, 
  autoRotate = true,
  rotationSpeed = 0.005,
  scale = 1,
}: CatMeshProps) {
  const [loadError, setLoadError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const groupRef = useRef<Group>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Загружаем модель с обработкой ошибок
  let scene = null;
  try {
    const { scene: loadedScene } = useGLTF('/assets/models/cat.glb');
    scene = loadedScene;
  } catch (error) {
    console.warn('⚠️ Failed to load cat model:', error);
    if (!loadError) setLoadError(true);
  }

  // ✅ ИСПРАВЛЕНО: используем правильную проверку на Mesh
  const clonedScene = useMemo(() => {
    if (scene) {
      const clone = scene.clone();
      // ✅ Используем type вместо isMesh
      clone.traverse((child: Object3D) => {
        // Проверяем, является ли объект Mesh через type или instanceof
        if (child.type === 'Mesh' || child instanceof Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return clone;
    }
    return null;
  }, [scene]);

  // Анимация вращения
  useFrame((state) => {
    if (groupRef.current && autoRotate) {
      const speed = isHovered ? rotationSpeed * 0.5 : rotationSpeed;
      groupRef.current.rotation.y += speed;
      
      if (isHovered) {
        const bobOffset = Math.sin(state.clock.elapsedTime * 2) * 0.02;
        groupRef.current.position.y = bobOffset;
      } else {
        groupRef.current.position.y = 0;
      }
    }
  });

  // Обработка клика
  const handlePointerDown = useCallback((event: any) => {
    if (!groupRef.current || !onVisualClick) return;

    const clientX = event.clientX || event.originalEvent?.clientX || 0;
    const clientY = event.clientY || event.originalEvent?.clientY || 0;
    
    onVisualClick(clientX, clientY);
    
    setIsClicked(true);
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      setIsClicked(false);
    }, 200);
  }, [onVisualClick]);

  // Обработка наведения
  const handlePointerOver = useCallback(() => {
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  // Очистка
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      document.body.style.cursor = 'default';
    };
  }, []);

  if (loadError || !clonedScene) {
    return (
      <group 
        ref={groupRef}
        scale={scale}
        onClick={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <FallbackCat />
      </group>
    );
  }

  const scaledModel = useMemo(() => {
    const clone = clonedScene.clone();
    clone.scale.set(scale, scale, scale);
    return clone;
  }, [clonedScene, scale]);

  return (
    <group 
      ref={groupRef}
      onClick={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      scale={isClicked ? 0.95 : 1}
      position={[0, isHovered ? 0.1 : 0, 0]}
    >
      <primitive object={scaledModel} />
      
      {isHovered && (
        <pointLight 
          position={[0, 1, 1]} 
          intensity={0.5} 
          color="#ff8c00" 
          distance={2}
        />
      )}
    </group>
  );
}

// Preload
useGLTF.preload('/assets/models/cat.glb');
useGLTF.preload('/assets/models/cat_superhero.glb');
useGLTF.preload('/assets/models/cat_legendary.glb');