import { forwardRef, useImperativeHandle, useRef } from "react";
import { AdditiveBlending, type Group, type SpriteMaterial, type Texture } from "three";

export interface GradientBlobHandle {
  group: Group | null;
  material: SpriteMaterial | null;
}

interface GradientBlobProps {
  texture: Texture;
  color: string;
  opacity?: number;
}

/**
 * Componente presentacional: un sprite (siempre de cara a la cámara) con una
 * textura de degradado radial compartida, tintado por `material.color`. Toda
 * la animación (posición, escala, color) la controla el padre (`SceneContent`)
 * mutando `group`/`material` cada frame vía el ref expuesto.
 */
const GradientBlob = forwardRef<GradientBlobHandle, GradientBlobProps>(function GradientBlob(
  { texture, color, opacity = 0.9 },
  ref,
) {
  const groupRef = useRef<Group>(null);
  const materialRef = useRef<SpriteMaterial>(null);

  useImperativeHandle(
    ref,
    () => ({
      get group() {
        return groupRef.current;
      },
      get material() {
        return materialRef.current;
      },
    }),
    [],
  );

  return (
    <group ref={groupRef}>
      <sprite>
        <spriteMaterial
          ref={materialRef}
          map={texture}
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </sprite>
    </group>
  );
});

export default GradientBlob;
