precision highp float;

uniform sampler2D uTexture;   // the <video> frame, bound per-frame
uniform vec2  uResolution;    // canvas size in device pixels (plane)
uniform vec2  uMediaSize;     // intrinsic video size (e.g. 1280x720)
uniform float uTime;
uniform float uVelocity;      // 0..1 smoothed scroll velocity
uniform float uReady;         // 1.0 once the video has decodable frames

varying vec2 vUv;

// cheap flowing noise — two crossed sine fields drifting over time
float noise(vec2 p) {
  return sin(p.x * 8.0 + uTime) * 0.5 + cos(p.y * 8.0 - uTime) * 0.5;
}

// object-fit: cover, done in UV space so the film never stretches or letterboxes
vec2 coverUv(vec2 uv) {
  float planeRatio = uResolution.x / uResolution.y;
  float mediaRatio = uMediaSize.x / uMediaSize.y;
  float aspect = planeRatio / mediaRatio;
  vec2 s = aspect >= 1.0 ? vec2(1.0, 1.0 / aspect) : vec2(aspect, 1.0);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  vec2 uv = coverUv(vUv);

  // ripple amplitude grows with scroll speed, settles to 0 at rest
  float amp = 0.05 * uVelocity;
  vec2 disp = vec2(noise(uv * 3.0), noise(uv.yx * 3.0)) * amp;

  // chromatic split scales with velocity for a glassy, liquid feel
  float ca = 0.006 * uVelocity;
  float r = texture2D(uTexture, uv + disp + vec2(ca, 0.0)).r;
  float g = texture2D(uTexture, uv + disp).g;
  float b = texture2D(uTexture, uv + disp - vec2(ca, 0.0)).b;

  vec3 col = vec3(r, g, b);

  // subtle cinematic vignette
  vec2 c = vUv - 0.5;
  float vig = smoothstep(0.95, 0.35, length(c));
  col *= mix(0.82, 1.0, vig);

  // fade in only once the video can paint; before that stay transparent so the
  // DOM <video> poster shows through (never a black box)
  gl_FragColor = vec4(col, uReady);
}
