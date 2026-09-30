import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { cn } from '@/lib/cn'
import fragmentShader from '@/shaders/flow.frag?raw'
import vertexShader from '@/shaders/flow.vert?raw'

const COLOR_A = new THREE.Color('#1b1f3b')
const COLOR_B = new THREE.Color('#c9a227')

/** Shared pointer in 0..1 canvas space, written by the tracker, read by the plane. */
const pointerTarget = new THREE.Vector2(0.5, 0.5)

function FlowPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size, viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uColorA: { value: COLOR_A.clone() },
      uColorB: { value: COLOR_B.clone() },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    [],
  )

  // Keep the shader resolution in sync with the drawing buffer.
  useEffect(() => {
    const dpr = viewport.dpr
    uniforms.uResolution.value.set(size.width * dpr, size.height * dpr)
  }, [size, viewport.dpr, uniforms])

  useFrame((state, delta) => {
    const material = materialRef.current
    if (!material) return

    material.uniforms.uTime.value = state.clock.elapsedTime
    // Frame-rate independent ease toward the pointer.
    material.uniforms.uPointer.value.lerp(pointerTarget, 1 - Math.exp(-4 * delta))
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

function PointerTracker() {
  const { gl } = useThree()

  useEffect(() => {
    const el = gl.domElement
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      pointerTarget.set(
        (event.clientX - rect.left) / rect.width,
        1 - (event.clientY - rect.top) / rect.height,
      )
    }
    el.addEventListener('pointermove', onMove)
    return () => el.removeEventListener('pointermove', onMove)
  }, [gl])

  return null
}

type FlowCanvasProps = {
  className?: string
}

export function FlowCanvas({ className }: FlowCanvasProps) {
  return (
    <Canvas
      className={cn('bg-ink-950', className)}
      dpr={[1, 2]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
    >
      <FlowPlane />
      <PointerTracker />
    </Canvas>
  )
}
