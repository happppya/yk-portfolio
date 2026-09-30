'use client'

import { useEffect, useRef } from 'react'
import { Color, LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer, WebGLRenderTarget } from 'three'
import { ATMOSPHERE_FPS, atmosphereSize, pointerImpulse, pointerUv, shouldRenderAtmosphere, simulationDelta } from '@/lib/atmosphere'
import vertexShader from '@/shaders/atmosphere.vert?raw'
import flowShader from '@/shaders/atmosphere-flow.frag?raw'
import displayShader from '@/shaders/atmosphere-display.frag?raw'

// Lightweight advected dye/velocity feedback, not a pressure-solved fluid solver.
// Two small RGBA8 buffers keep the wake persistent without float-texture extensions.
export default function MeAtmosphere() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current
    if (!element) return
    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power', precision: 'mediump' })
    } catch {
      return // The CSS atmosphere remains when WebGL is unavailable.
    }
    const canvas = renderer.domElement
    canvas.setAttribute('aria-hidden', 'true')
    element.appendChild(canvas)
    renderer.setPixelRatio(1)
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const scene = new Scene()
    const geometry = new PlaneGeometry(2, 2)
    const makeTarget = () => new WebGLRenderTarget(1, 1, { minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false, stencilBuffer: false })
    let read = makeTarget()
    let write = makeTarget()
    const pointer = new Vector2(0.5, 0.5)
    const previous = new Vector2(0.5, 0.5)
    const impulse = new Vector2()
    const flow = new ShaderMaterial({ vertexShader, fragmentShader: flowShader, depthTest: false, depthWrite: false,
      uniforms: { uPrevious: { value: read.texture }, uTexel: { value: new Vector2() }, uPointer: { value: pointer },
        uImpulse: { value: impulse }, uAspect: { value: 1 }, uTime: { value: 0 }, uDelta: { value: 0 }, uActive: { value: 0 } } })
    const display = new ShaderMaterial({ vertexShader, fragmentShader: displayShader, depthTest: false, depthWrite: false,
      uniforms: { uField: { value: read.texture }, uAspect: { value: 1 }, uTime: { value: 0 },
        uSurface: { value: new Color() }, uInk: { value: new Color() }, uAccent: { value: new Color() } } })
    const quad = new Mesh(geometry, flow)
    quad.frustumCulled = false
    scene.add(quad)

    let frame = 0
    let last = 0
    let time = 4
    let active = 0
    let visible = true
    let contextLost = false
    let shaderFailed = false
    let disposed = false
    let needsClear = true
    let hasPointer = false
    let pausedForOverlay = false
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    const colors = () => {
      const styles = getComputedStyle(document.documentElement)
      display.uniforms.uSurface.value.setStyle(styles.getPropertyValue('--surface').trim())
      display.uniforms.uInk.value.setStyle(styles.getPropertyValue('--text').trim())
      display.uniforms.uAccent.value.setStyle(styles.getPropertyValue('--accent').trim())
    }
    const canRender = () => !disposed && !shaderFailed && !pausedForOverlay && shouldRenderAtmosphere({ visible, hidden: document.hidden, contextLost })
    const stop = () => { cancelAnimationFrame(frame); frame = 0; last = 0 }
    const clear = () => {
      renderer.setClearColor(new Color(0, 0.5, 0.5), 1)
      for (const target of [read, write]) { renderer.setRenderTarget(target); renderer.clear() }
      renderer.setRenderTarget(null)
      needsClear = false
    }
    const draw = (now: number) => {
      frame = 0
      if (!canRender()) return
      if (!reduced.matches && last && now - last < 1000 / ATMOSPHERE_FPS - 1) { frame = requestAnimationFrame(draw); return }
      const delta = reduced.matches ? 0 : simulationDelta(last ? (now - last) / 1000 : 1 / ATMOSPHERE_FPS)
      last = now
      time += delta
      if (needsClear) clear()
      const force = pointerImpulse(previous, pointer, delta)
      impulse.set(force.x, force.y)
      previous.copy(pointer)
      active *= Math.exp(-delta * 1.3)
      flow.uniforms.uActive.value = reduced.matches ? 0 : active
      flow.uniforms.uTime.value = time
      flow.uniforms.uDelta.value = delta
      flow.uniforms.uPrevious.value = read.texture
      quad.material = flow
      renderer.setRenderTarget(write)
      renderer.render(scene, camera)
      ;[read, write] = [write, read]
      display.uniforms.uField.value = read.texture
      display.uniforms.uTime.value = time
      quad.material = display
      renderer.setRenderTarget(null)
      renderer.render(scene, camera)
      if (!shaderFailed) element.dataset.ready = 'true'
      if (!reduced.matches && canRender()) frame = requestAnimationFrame(draw)
    }
    const start = () => { if (!frame && canRender()) frame = requestAnimationFrame(draw) }
    const sync = () => {
      pausedForOverlay = Boolean(document.querySelector('dialog[open]')) || Boolean(document.documentElement.dataset.transition)
      if (canRender()) start(); else stop()
    }
    const resize = () => {
      const size = atmosphereSize(window.innerWidth, window.innerHeight)
      renderer.setSize(size.width, size.height, false)
      read.setSize(size.width, size.height)
      write.setSize(size.width, size.height)
      const aspect = window.innerWidth / Math.max(1, window.innerHeight)
      flow.uniforms.uTexel.value.set(1 / size.width, 1 / size.height)
      flow.uniforms.uAspect.value = aspect
      display.uniforms.uAspect.value = aspect
      needsClear = true
      start()
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || reduced.matches || !canRender()) return
      const next = pointerUv(event.clientX, event.clientY, window.innerWidth, window.innerHeight)
      if (!hasPointer) { previous.set(next.x, next.y); hasPointer = true }
      pointer.set(next.x, next.y)
      active = 1
    }
    const leave = () => { hasPointer = false; active = 0 }
    const lost = (event: Event) => { event.preventDefault(); contextLost = true; element.dataset.ready = 'false'; stop() }
    const restored = () => { contextLost = false; needsClear = true; sync() }
    const theme = () => { colors(); start() }
    const motion = () => { stop(); needsClear = true; active = 0; start() }
    renderer.debug.onShaderError = () => { shaderFailed = true; element.dataset.ready = 'false'; stop() }
    colors()
    resize()
    quad.material = flow
    renderer.compile(scene, camera)
    quad.material = display
    renderer.compile(scene, camera)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      element.dataset.visible = String(visible)
      sync()
    }, { threshold: 0 })
    const hero = document.querySelector('.me-hero')
    if (hero) observer.observe(hero)
    const themeObserver = new MutationObserver(theme)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const overlayObserver = new MutationObserver(sync)
    overlayObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-transition'] })
    overlayObserver.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] })
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('blur', leave)
    document.addEventListener('visibilitychange', sync)
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', restored)
    reduced.addEventListener('change', motion)
    scheme.addEventListener('change', theme)
    sync()

    return () => {
      disposed = true
      stop()
      observer.disconnect(); themeObserver.disconnect(); overlayObserver.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('blur', leave)
      document.removeEventListener('visibilitychange', sync)
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', restored)
      reduced.removeEventListener('change', motion)
      scheme.removeEventListener('change', theme)
      geometry.dispose(); flow.dispose(); display.dispose(); read.dispose(); write.dispose()
      renderer.dispose(); renderer.forceContextLoss()
      canvas.remove()
    }
  }, [])

  return <div ref={host} className="me-atmosphere" aria-hidden="true" />
}
