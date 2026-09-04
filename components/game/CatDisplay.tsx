// components/game/CatDisplay.tsx
'use client';

import { useGLTF } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { DRACOLoader } from 'three-stdlib'; // ✅ Добавлено

interface CatDisplayProps {
  url: string;
  scale?: number;
  rotationSpeed?: number;
  isLegendary?: boolean;
}

// ✅ Настройка DRACO загрузчика
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

export function CatDisplay({ 
  url, 
  scale = 1.2, 
  rotationSpeed = 0.003,
  isLegendary = false 
}: CatDisplayProps) {
  // ✅ Используем DRACO для загрузки
  const { scene } = useGLTF(url, true, true, (loader) => {
    loader.setDRACOLoader(dracoLoader);
  });
  
  const groupRef = useRef<Group>(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.scale.set(scale, scale, scale);
    return clone;
  }, [scene, scale]);

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