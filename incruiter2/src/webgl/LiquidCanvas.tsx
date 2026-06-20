import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';
import frag from './shaders/liquid.frag?raw';
import vert from './shaders/liquid.vert?raw';

type Props = {
  /** Shared <video> element — used as the GL texture source (decoded once). */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Smoothed scroll velocity 0..1, read each frame. */
  velRef: React.MutableRefObject<number>;
};

/**
 * Full-screen fixed canvas that re-draws the film with velocity-driven liquid
 * displacement + chromatic aberration. Sits above the plain <video> (which is the
 * crisp fallback) and renders the same single decoded video — no double decode.
 */
export default function LiquidCanvas({ videoRef, velRef }: Props) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = wrap.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // crisp but cheap
    const renderer = new Renderer({ dpr, alpha: true, antialias: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    mount.appendChild(gl.canvas);

    const texture = new Texture(gl, {
      generateMipmaps: false,
      width: 1280,
      height: 720,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
    });

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uVelocity: { value: 0 },
        uReady: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uMediaSize: { value: [1280, 720] },
        uTexture: { value: texture },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };
    window.addEventListener('resize', resize);
    resize();

    let smooth = 0;
    let raf = 0;
    let ready = 0;
    let hidden = false;

    const onVisibility = () => {
      hidden = document.visibilityState === 'hidden';
    };
    document.addEventListener('visibilitychange', onVisibility);

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (hidden) return; // don't burn GPU when tab is in the background

      const v = videoRef.current;
      if (v && v.readyState >= 2 && v.videoWidth) {
        texture.image = v as unknown as HTMLImageElement;
        texture.needsUpdate = true;
        program.uniforms.uMediaSize.value = [v.videoWidth, v.videoHeight];
        ready = Math.min(ready + 0.04, 1); // gentle fade-in to avoid a pop
      }

      // ease velocity toward target, then settle calmly toward 0 when idle
      smooth += (velRef.current - smooth) * 0.08;
      program.uniforms.uTime.value = t * 0.001;
      program.uniforms.uVelocity.value = smooth;
      program.uniforms.uReady.value = ready;

      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.canvas.remove();
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
    };
  }, [videoRef, velRef]);

  return <div ref={wrap} className="liquid" aria-hidden="true" />;
}
