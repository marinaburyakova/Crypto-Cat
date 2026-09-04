// components/game/CatDisplay.tsx
'use client';

import { useGLTF } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

interface CatDisplayProps {
  url: string;
  scale?: number;
  rotationSpeed?: number;
}

export function CatDisplay({ url, scale = 1.2, rotationSpeed = 0.003 }: CatDisplayProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Group>(null);

  // Клонируем сцену - без изменения материалов
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.scale.set(scale, scale, scale);
    return clone;
  }, [scene, scale]);

  // Только плавное вращение
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });

  return <primitive ref={groupRef} object={clonedScene} />;
}

// Preload
useGLTF.preload('/assets/models/cat.glb');
useGLTF.preload('/assets/models/cat_superhero.glb');
useGLTF.preload('/assets/models/cat_legendary.glb');