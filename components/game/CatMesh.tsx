// components/game/CatMesh.tsx
'use client';

import { useGLTF } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

interface CatMeshProps {
  onVisualClick: (x: number, y: number) => void;
}

export function CatMesh({ onVisualClick }: CatMeshProps) {
  const [loadError, setLoadError] = useState(false);
  const groupRef = useRef<Group>(null);
  
  // Загружаем модель
  const { scene, nodes, materials } = useGLTF('/assets/models/cat.glb');
  
  // Клонируем сцену, чтобы избежать проблем с кешированием
  const clonedScene = scene.clone();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  // Если модель не загрузилась, показываем заглушку
  if (!clonedScene) {
    return (
      <group ref={groupRef}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff8c00" />
        </mesh>
      </group>
    );
  }

  return <primitive ref={groupRef} object={clonedScene} />;
}