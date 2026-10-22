import { useEffect, useRef } from "react";
import * as THREE from "three";
import { isLite, isLow } from "../lib/perf";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export interface AboutEnergy {
  speed: number; // driven by the GSAP timeline (chapter intensity)
  vel: number; // scroll velocity, written every frame by the parent
}

/* ====================================================================================
   REAL 3D CHARACTER — "Expressive Robot" (rigged + skinned GLB, 14 baked animations)
   - tries /models/RobotExpressive.glb first (put the file in /public/models for offline),
     then falls back to a CDN copy
   - materialize (scan-dissolve) entrance, holographic rim + scan sweep injected into
     the model's own PBR materials
   - animation director: Idle <-> Wave / ThumbsUp / Yes / Jump / Dance with cross-fades
   - head follows the cursor, face morph expressions, scroll energy speeds it up
   ==================================================================================== */

const MODEL_URLS = [
  "/models/RobotExpressive.glb",
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
  "https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
];

const FLOOR = -1.72;
const HEIGHT = 3.15; // character height in scene units

/* ---------- shaders (stage) ---------- */

const PLANE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FLOOR_FRAG = /* glsl */ `
uniform float uTime; uniform float uEnergy; varying vec2 vUv;
void main(){
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  float ang = atan(p.y, p.x);
  float fade = smoothstep(1.0, 0.15, r);
  float rings = smoothstep(0.6, 1.0, sin(r * 36.0 - uTime * (2.0 + uEnergy))) * fade * 0.55;
  float spokes = smoothstep(0.92, 1.0, sin(ang * 24.0 + uTime * 0.4)) * fade * 0.22;
  float edge = smoothstep(0.03, 0.0, abs(r - 0.96)) * 0.9;
  float core = smoothstep(0.55, 0.0, r) * 0.45;
  vec3 c = mix(vec3(0.37, 0.85, 1.0), vec3(0.55, 0.48, 1.0), r);
  c = mix(c, vec3(1.0, 0.37, 0.68), smoothstep(0.7, 1.0, r) * 0.6);
  float a = rings + spokes + edge + core;
  gl_FragColor = vec4(c * a, a);
}`;

const BEAM_VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - w.xyz);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const BEAM_FRAG = /* glsl */ `
uniform float uTime; uniform float uEnergy; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  float h = vUv.y;
  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.4);
  float streak = 0.5 + 0.5 * sin(vUv.x * 6.2832 * 18.0 - uTime * 1.5);
  float a = pow(1.0 - h, 1.7) * 0.2 * (0.3 + f) * (0.6 + 0.4 * streak) * (0.8 + uEnergy * 0.12);
  vec3 c = mix(vec3(0.37, 0.85, 1.0), vec3(0.55, 0.48, 1.0), h);
  gl_FragColor = vec4(c * a, a);
}`;

const STREAM_VERT = /* glsl */ `
attribute vec4 aSeed; // x angle, y radius, z speed, w phase
uniform float uTime; uniform float uEnergy; uniform float uScale; uniform float uSize;
uniform float uRMin; uniform float uRMax; uniform float uTop;
varying float vA; varying vec3 vC;
void main(){
  float life = fract(aSeed.w + uTime * (0.05 + aSeed.z * 0.1) * (0.55 + uEnergy * 0.45));
  float y = ${FLOOR.toFixed(2)} + life * uTop;
  float r = mix(uRMin, uRMax, aSeed.y) * (0.45 + 0.75 * smoothstep(0.0, 0.45, life)) * (1.0 + 0.25 * sin(life * 7.0 + aSeed.x * 3.0));
  float a = aSeed.x * 6.2832 + life * (3.0 + aSeed.z * 4.0) + uTime * 0.25;
  vec3 p = vec3(cos(a) * r, y, sin(a) * r);
  vA = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.65, 1.0, life));
  float k = fract(aSeed.x * 7.0 + aSeed.z * 3.0);
  vC = k < 0.5 ? mix(vec3(0.37, 0.85, 1.0), vec3(0.55, 0.48, 1.0), k * 2.0) : mix(vec3(0.55, 0.48, 1.0), vec3(1.0, 0.37, 0.68), (k - 0.5) * 2.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * (0.5 + aSeed.z) * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const STREAM_FRAG = /* glsl */ `
varying float vA; varying vec3 vC;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vC * (0.7 + a), a * a * vA);
}`;

/* ---------- animation director ---------- */

// [clip, seconds (0 = play once, full length)]
const SEQUENCE: [string, number][] = [
  ["Idle", 3.5],
  ["Wave", 0],
  ["Idle", 3],
  ["ThumbsUp", 0],
  ["Idle", 3],
  ["Yes", 0],
  ["Idle", 2.5],
  ["Dance", 6],
  ["Idle", 3],
  ["Jump", 0],
];
const ONE_SHOT = new Set(["Wave", "ThumbsUp", "Yes", "No", "Jump", "Punch"]);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* ---------- component ---------- */

export default function AboutCore({ energy }: { energy: AboutEnergy }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: !isLite(), alpha: true, powerPreference: "high-performance" });
    const PR = isLow() ? 0.75 : Math.min(window.devicePixelRatio || 1, isLite() ? 1.25 : 2);
    renderer.setPixelRatio(PR);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const FOV = 40;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
    camera.position.set(0, 0.75, 6.3);
    camera.lookAt(0, -0.05, 0);

    const group = new THREE.Group();
    scene.add(group);

    const U = {
      uTime: { value: 0 },
      uEnergy: { value: 1 },
      uScale: { value: 600 },
      uReveal: { value: FLOOR - 1 }, // world-y of the materialize scan line
    };

    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(o: T): T => (disposables.push(o), o);

    /* ---------- lighting (tinted to the site palette) ---------- */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.22;
    disposables.push(pmrem, envTex);

    scene.add(new THREE.HemisphereLight(0x9fb8ff, 0x1a1030, 0.3));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(2.5, 3.5, 4);
    scene.add(key);
    const rimC = new THREE.DirectionalLight(0x5fd8ff, 4.2);
    rimC.position.set(-3, 1.5, -2.5);
    scene.add(rimC);
    const rimP = new THREE.DirectionalLight(0xff5fae, 3.6);
    rimP.position.set(3, 0.5, -2.5);
    scene.add(rimP);
    const fill = new THREE.PointLight(0x8b7bff, 9, 6, 2);
    fill.position.set(0, -1.2, 1.6);
    scene.add(fill);

    /* ---------- stage: aura, floor, beam, particles ---------- */
    const glowTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d")!;
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.25, "rgba(255,255,255,0.35)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
      return track(new THREE.CanvasTexture(c));
    })();
    const aura = new THREE.Sprite(
      track(new THREE.SpriteMaterial({ map: glowTex, color: 0x6a5cff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    aura.scale.setScalar(4.8);
    aura.position.set(0, 0.1, -0.9);
    group.add(aura);

    const floor = new THREE.Mesh(
      track(new THREE.CircleGeometry(1.7, 96)),
      track(
        new THREE.ShaderMaterial({
          vertexShader: PLANE_VERT,
          fragmentShader: FLOOR_FRAG,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: { uTime: U.uTime, uEnergy: U.uEnergy },
        }),
      ),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR;
    group.add(floor);

    const beam = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.7, 1.2, 3.8, 64, 1, true)),
      track(
        new THREE.ShaderMaterial({
          vertexShader: BEAM_VERT,
          fragmentShader: BEAM_FRAG,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          uniforms: { uTime: U.uTime, uEnergy: U.uEnergy },
        }),
      ),
    );
    beam.position.y = FLOOR + 1.9;
    group.add(beam);

    const makeStream = (count: number, rMin: number, rMax: number, size: number, top: number) => {
      const seeds = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        seeds[i * 4] = Math.random();
        seeds[i * 4 + 1] = Math.pow(Math.random(), 0.8);
        seeds[i * 4 + 2] = Math.random();
        seeds[i * 4 + 3] = Math.random();
      }
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      const mat = track(
        new THREE.ShaderMaterial({
          vertexShader: STREAM_VERT,
          fragmentShader: STREAM_FRAG,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: U.uTime,
            uEnergy: U.uEnergy,
            uScale: U.uScale,
            uSize: { value: size },
            uRMin: { value: rMin },
            uRMax: { value: rMax },
            uTop: { value: top },
          },
        }),
      );
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      return pts;
    };
    group.add(makeStream(600, 1.35, 1.9, 0.05, 3.8));
    group.add(makeStream(350, 1.9, 2.8, 0.035, 4.0));

    /* ---------- character ---------- */
    let robot: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let headBone: THREE.Object3D | null = null;
    let faceMesh: THREE.Mesh | null = null;
    const actions: Record<string, THREE.AnimationAction> = {};
    let active: THREE.AnimationAction | null = null;
    let activeName = "";
    let revealStart = -1;

    // inject holographic rim + scan sweep + materialize dissolve into the model's own materials
    const upgradeMaterial = (m: THREE.Material) => {
      if (!(m instanceof THREE.MeshStandardMaterial)) return;
      m.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = U.uTime;
        shader.uniforms.uEnergy = U.uEnergy;
        shader.uniforms.uReveal = U.uReveal;
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
          .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying vec3 vWPos; uniform float uTime; uniform float uEnergy; uniform float uReveal;",
          )
          .replace(
            "#include <clipping_planes_fragment>",
            `#include <clipping_planes_fragment>
            float revealEdge = uReveal - vWPos.y;
            if (revealEdge < 0.0) discard;`,
          )
          .replace(
            "#include <opaque_fragment>",
            `float rim = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.6);
            float y01 = (vWPos.y - (${FLOOR.toFixed(2)})) / ${HEIGHT.toFixed(2)};
            float sweep = exp(-pow((y01 - fract(uTime * 0.16)) * 16.0, 2.0));
            float scan = smoothstep(0.7, 1.0, 0.5 + 0.5 * sin(vWPos.y * 90.0 - uTime * 5.0));
            vec3 holo = mix(vec3(0.37, 0.85, 1.0), vec3(0.55, 0.48, 1.0), clamp(y01, 0.0, 1.0));
            outgoingLight += holo * (rim * (0.55 + uEnergy * 0.15) + sweep * 0.45 + scan * rim * 0.25);
            outgoingLight += vec3(0.37, 0.85, 1.0) * smoothstep(0.14, 0.0, revealEdge) * 2.4;
            #include <opaque_fragment>`,
          );
      };
      m.needsUpdate = true;
    };

    const play = (name: string, fade = 0.4) => {
      const next = actions[name];
      if (!next || next === active) return;
      next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(fade).play();
      if (active) active.fadeOut(fade);
      active = next;
      activeName = name;
    };

    const loader = new GLTFLoader();
    const load = (i: number) => {
      if (i >= MODEL_URLS.length) {
        console.warn("[AboutCore] could not load the character model");
        return;
      }
      loader.load(
        MODEL_URLS[i],
        (gltf) => {
          if (disposed) return;
          robot = gltf.scene;
          // normalise: scale to HEIGHT, feet on the floor, centred
          const box = new THREE.Box3().setFromObject(robot);
          const size = box.getSize(new THREE.Vector3());
          const s = HEIGHT / (size.y || 1);
          robot.scale.setScalar(s);
          robot.position.set(0, FLOOR - box.min.y * s + 0.02, 0);
          robot.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              (Array.isArray(o.material) ? o.material : [o.material]).forEach(upgradeMaterial);
              if (o.morphTargetInfluences && o.morphTargetDictionary && "Angry" in o.morphTargetDictionary) faceMesh = o;
            }
            if ((o as THREE.Bone).isBone && o.name === "Head" && !headBone) headBone = o;
          });
          group.add(robot);

          mixer = new THREE.AnimationMixer(robot);
          gltf.animations.forEach((clip) => {
            const a = mixer!.clipAction(clip);
            if (ONE_SHOT.has(clip.name)) {
              a.setLoop(THREE.LoopOnce, 1);
              a.clampWhenFinished = true;
            }
            actions[clip.name] = a;
          });
          play("Idle", 0.01);
          revealStart = t;
        },
        undefined,
        () => load(i + 1),
      );
    };
    load(0);

    /* ---------- sizing + input ---------- */
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      U.uScale.value = (h * PR) / (2 * Math.tan((FOV * Math.PI) / 360));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const mouse = new THREE.Vector2();
    const mouseT = new THREE.Vector2();
    const onMove = (e: PointerEvent) => {
      mouseT.set((e.clientX / window.innerWidth - 0.5) * 2, -(e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove);

    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting), { threshold: 0 });
    io.observe(host);

    /* ---------- loop ---------- */
    let seqI = 0;
    let seqT = 0;
    let seqLen = SEQUENCE[0][1];
    let yaw = 0;
    let pitch = 0;
    const morph = [0, 0, 0]; // Angry, Surprised, Sad
    const qOff = new THREE.Quaternion();
    const qP = new THREE.Quaternion();
    const qH = new THREE.Quaternion();
    const eul = new THREE.Euler();
    let last = performance.now();
    let t = 0;
    let e = 1;
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      if (isLow() && now - last < 30) return; // ~30fps on devices without a GPU (time keeps accumulating, so speed is unchanged)
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;

      const target = energy.speed + Math.min(energy.vel / 1200, 2.5);
      e += (target - e) * 0.06;
      t += dt * (0.7 + e * 0.3);
      mouse.lerp(mouseT, 0.06);
      const surge = clamp((e - 1.8) / 1.4, 0, 1);

      U.uTime.value = t;
      U.uEnergy.value = e;

      if (robot && mixer) {
        // materialize scan
        if (revealStart >= 0) {
          const k = clamp((t - revealStart) / 2.2, 0, 1);
          const eased = 1 - Math.pow(1 - k, 3);
          U.uReveal.value = FLOOR - 0.2 + eased * (HEIGHT + 0.6);
        }

        // animation director
        seqT += dt;
        if (surge > 0.45) {
          if (activeName !== "Dance") play("Dance", 0.5);
          seqT = 0;
        } else {
          if (seqT >= seqLen) {
            seqI = (seqI + 1) % SEQUENCE.length;
            const [name, secs] = SEQUENCE[seqI];
            play(name, 0.4);
            seqLen = secs > 0 ? secs : (actions[name]?.getClip().duration ?? 2) - 0.2;
            seqT = 0;
          }
        }
        mixer.timeScale = clamp(0.85 + e * 0.15, 0.8, 1.6);
        mixer.update(dt);

        // body follows the pointer a little
        robot.rotation.y += (mouse.x * 0.35 - robot.rotation.y) * 0.06;

        // head look-at (applied on top of the baked animation, in world space)
        if (headBone && headBone.parent) {
          robot.updateMatrixWorld(true);
          yaw += (clamp(mouse.x * 0.7, -0.7, 0.7) - yaw) * 0.08;
          pitch += (clamp(-mouse.y * 0.35, -0.35, 0.35) - pitch) * 0.08;
          eul.set(pitch * 0.8, yaw - robot.rotation.y * 0.6, 0, "YXZ");
          qOff.setFromEuler(eul);
          headBone.parent.getWorldQuaternion(qP);
          headBone.getWorldQuaternion(qH);
          qH.premultiply(qOff);
          headBone.quaternion.copy(qP.invert().multiply(qH));
        }

        // face expressions
        if (faceMesh && faceMesh.morphTargetInfluences) {
          const tgtSurprise = activeName === "Jump" ? 0.9 : surge * 0.7;
          const tgtAngry = 0;
          morph[0] += (tgtAngry - morph[0]) * 0.1;
          morph[1] += (tgtSurprise - morph[1]) * 0.1;
          morph[2] += (0 - morph[2]) * 0.1;
          faceMesh.morphTargetInfluences[0] = morph[0];
          faceMesh.morphTargetInfluences[1] = morph[1];
          faceMesh.morphTargetInfluences[2] = morph[2];
        }
      }

      fill.intensity = 9 + surge * 18 + Math.sin(t * 3) * 1.5;
      aura.material.opacity = 0.24 + 0.05 * Math.sin(t * 0.8) + surge * 0.2;
      group.position.set(mouse.x * 0.1, mouse.y * 0.05, 0);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      mixer?.stopAllAction();
      robot?.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
            for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
            m.dispose();
          });
        }
      });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [energy]);

  return <div ref={hostRef} className="ab-core__canvas" />;
}