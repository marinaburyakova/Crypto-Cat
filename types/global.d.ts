// src/types/global.d.ts
/// <reference types="next" />
/// <reference types="next/types/global" />

// Объявление для CSS файлов
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Для изображений
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

// Для GLB/GLTF моделей
declare module '*.glb' {
  const content: string;
  export default content;
}

declare module '*.gltf' {
  const content: string;
  export default content;
}
