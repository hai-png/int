'use client'

import React, { useState, useRef } from 'react'
import { useExperienceStore } from '@/store/experience-store'
import {
  Download,
  Copy,
  Code,
  FileJson,
  Check,
  RotateCcw,
  Upload,
  AlertCircle,
} from 'lucide-react'

export function ExportPanel() {
  const { exportProject, importProject, resetProject, projectName } = useExperienceStore()
  const [copied, setCopied] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const importInputRef = useRef<HTMLInputElement>(null)

  const projectData = exportProject()
  const jsonStr = JSON.stringify(projectData, null, 2)

  const iframeCode = `<iframe
  src="/viewer?id=${projectData.projectId}"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen
></iframe>`

  const reactCode = `import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'

const config = ${jsonStr}

export default function MyExperience() {
  return (
    <Canvas
      camera={{
        position: config.camera?.initialPosition || [5, 3, 5],
        fov: config.camera?.fov || 50,
        near: config.camera?.near || 0.1,
        far: config.camera?.far || 1000,
      }}
      style={{ width: '100%', height: '600px' }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      {config.environment?.preset && (
        <Environment preset={config.environment.preset} />
      )}
      <OrbitControls target={config.camera?.initialTarget || [0, 0, 0]} />
      {/* Add your 3D model and hotspots here using config data */}
    </Canvas>
  )
}`

  // ─── Full Standalone HTML Generator ────────────────────
  const generateStandaloneHtml = () => {
    const configJson = JSON.stringify(projectData, null, 4)

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0c1222; font-family: 'Inter', -apple-system, sans-serif; }
    #canvas-container { width: 100%; height: 100%; position: relative; }
    canvas { display: block; width: 100%; height: 100%; }

    /* Hotspot markers */
    .hotspot-marker {
      position: absolute;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      transform: translate(-50%, -50%);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      border: 2px solid rgba(255,255,255,0.3);
    }
    .hotspot-marker:hover {
      transform: translate(-50%, -50%) scale(1.3);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
    }
    .hotspot-marker .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid currentColor;
      animation: pulse-ring 2s ease-out infinite;
    }
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(2); opacity: 0; }
    }
    .hotspot-label {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.85);
      color: #fff;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      border: 1px solid rgba(16,185,129,0.4);
    }
    .hotspot-marker:hover .hotspot-label,
    .hotspot-marker.always-label .hotspot-label {
      opacity: 1;
    }

    /* Info panel for behaviors */
    .info-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(15,23,42,0.95);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: calc(100% - 32px);
      z-index: 100;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }
    .info-panel h3 { color: #e2e8f0; font-size: 16px; margin-bottom: 12px; }
    .info-panel p { color: #94a3b8; font-size: 13px; line-height: 1.5; }
    .info-panel .close-btn {
      margin-top: 16px;
      padding: 8px 20px;
      background: rgba(16,185,129,0.2);
      color: #10b981;
      border: 1px solid rgba(16,185,129,0.3);
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
    .info-panel .close-btn:hover { background: rgba(16,185,129,0.3); }

    /* Toast notifications */
    .toast-container {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .toast {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      backdrop-filter: blur(8px);
      animation: slide-in 0.3s ease;
    }
    .toast.info { background: rgba(59,130,246,0.2); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); }
    .toast.success { background: rgba(16,185,129,0.2); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
    .toast.warning { background: rgba(245,158,11,0.2); color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
    @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    /* Loading */
    .loading-screen {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
      background: #0c1222; z-index: 500; color: #64748b; font-size: 14px;
    }
    .loading-screen .spinner {
      width: 24px; height: 24px; border: 2px solid #334155; border-top-color: #10b981;
      border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Scene navigation */
    .scene-nav {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 8px; z-index: 50;
    }
    .scene-btn {
      padding: 6px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; color: #94a3b8; font-size: 12px; cursor: pointer; transition: all 0.2s;
    }
    .scene-btn:hover, .scene-btn.active { background: rgba(16,185,129,0.15); color: #10b981; border-color: rgba(16,185,129,0.3); }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  <div id="hotspots-overlay"></div>
  <div class="toast-container" id="toasts"></div>
  <div class="loading-screen" id="loading">
    <div class="spinner"></div>
    Loading 3D Experience...
  </div>

  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/"
    }
  }
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    // ─── Embedded Experience Config ────────────────────────
    const CONFIG = ${configJson};

    // ─── Scene Setup ──────────────────────────────────────
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      CONFIG.camera?.fov || 50,
      window.innerWidth / window.innerHeight,
      CONFIG.camera?.near || 0.1,
      CONFIG.camera?.far || 1000
    );
    camera.position.set(...(CONFIG.camera?.initialPosition || [5, 3, 5]));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // ─── Controls ──────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(...(CONFIG.camera?.initialTarget || [0, 0, 0]));
    controls.update();

    // ─── Lighting ──────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);

    // ─── Environment ───────────────────────────────────────
    const env = CONFIG.environment || {};
    if (env.type === 'color' && env.color) {
      scene.background = new THREE.Color(env.color);
    } else {
      scene.background = new THREE.Color('#0c1222');
    }
    if (env.intensity !== undefined) {
      renderer.toneMappingExposure = env.intensity;
    }

    // ─── Demo Scene (when no model) ────────────────────────
    function createDemoScene() {
      const group = new THREE.Group();

      // Platform
      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 0.1, 64),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.3 })
      );
      platform.position.y = -0.05;
      platform.receiveShadow = true;
      group.add(platform);

      // Center pedestal
      const pedestal = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1.5, 1),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.2 })
      );
      pedestal.position.y = 0.75;
      pedestal.castShadow = true;
      group.add(pedestal);

      // Torus knot
      const knot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.4, 0.12, 128, 32),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.15, metalness: 0.8, roughness: 0.15 })
      );
      knot.position.y = 2.0;
      knot.castShadow = true;
      group.add(knot);

      // Gold sphere
      const goldSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.1 })
      );
      goldSphere.position.set(1.2, 0.35, 0.8);
      goldSphere.castShadow = true;
      group.add(goldSphere);

      // Point lights
      const light1 = new THREE.PointLight(0x10b981, 2, 8, 2);
      light1.position.set(2, 3, 2);
      group.add(light1);

      const light2 = new THREE.PointLight(0xf59e0b, 1.5, 6, 2);
      light2.position.set(-2, 2, -1);
      group.add(light2);

      scene.add(group);
      return { group, knot };
    }

    // ─── Load Model or Demo ────────────────────────────────
    let animObjects = null;
    const model = CONFIG.model;
    if (model && model.url) {
      const loader = new GLTFLoader();
      loader.load(
        model.url,
        (gltf) => {
          const obj = gltf.scene;
          if (model.scale) obj.scale.setScalar(model.scale);
          if (model.position) obj.position.set(...model.position);
          if (model.rotation) {
            obj.rotation.set(
              model.rotation[0] * Math.PI / 180,
              model.rotation[1] * Math.PI / 180,
              model.rotation[2] * Math.PI / 180
            );
          }
          scene.add(obj);
          document.getElementById('loading').style.display = 'none';
        },
        undefined,
        () => {
          // Fallback to demo
          animObjects = createDemoScene();
          document.getElementById('loading').style.display = 'none';
        }
      );
    } else {
      animObjects = createDemoScene();
      document.getElementById('loading').style.display = 'none';
    }

    // ─── 3D Hotspot Markers ────────────────────────────────
    const hotspotSpheres = [];
    const hotspots = CONFIG.hotspots || [];
    const theme = CONFIG.theme || {};

    hotspots.forEach(h => {
      if (!h.visible) return;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({
          color: theme.hotspotIconColor || '#10b981',
          emissive: theme.hotspotIconColor || '#10b981',
          emissiveIntensity: 0.5
        })
      );
      sphere.position.set(...h.position);
      sphere.userData = { hotspot: h };
      scene.add(sphere);
      hotspotSpheres.push(sphere);
    });

    // ─── Raycasting ────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const overlay = document.getElementById('hotspots-overlay');

    function showToast(message, type = 'info') {
      const container = document.getElementById('toasts');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    function showPanel(title, content) {
      const existing = document.querySelector('.info-panel');
      if (existing) existing.remove();
      const panel = document.createElement('div');
      panel.className = 'info-panel';
      const h3 = document.createElement('h3');
      h3.textContent = title;
      const p = document.createElement('p');
      p.textContent = content;
      const btn = document.createElement('button');
      btn.className = 'close-btn';
      btn.textContent = 'Close';
      btn.onclick = () => panel.remove();
      panel.appendChild(h3);
      panel.appendChild(p);
      panel.appendChild(btn);
      document.body.appendChild(panel);
    }

    // Execute behavior actions
    function executeActions(actions) {
      actions.forEach(action => {
        switch(action.type) {
          case 'camera':
            if (action.action === 'moveTo' && action.position) {
              // Smooth camera move
              const targetPos = new THREE.Vector3(...action.position);
              const targetLookAt = action.lookAt ? new THREE.Vector3(...action.lookAt) : controls.target;
              const startPos = camera.position.clone();
              const startTarget = controls.target.clone();
              const duration = action.duration || 1000;
              const startTime = Date.now();
              function animateCamera() {
                const elapsed = Date.now() - startTime;
                const t = Math.min(elapsed / duration, 1);
                const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                camera.position.lerpVectors(startPos, targetPos, eased);
                controls.target.lerpVectors(startTarget, targetLookAt, eased);
                controls.update();
                if (t < 1) requestAnimationFrame(animateCamera);
              }
              animateCamera();
            }
            break;
          case 'visibility':
            showToast('Visibility: ' + (action.visibilityAction || 'toggle') + ' ' + (action.target || ''), 'info');
            break;
          case 'material':
            showToast('Material: ' + (action.property || 'color') + ' = ' + (action.value || '') + ' on ' + (action.target || ''), 'info');
            break;
          case 'ui':
            if (action.action === 'showPanel') {
              const panels = CONFIG.uiPanels || [];
              const panel = panels.find(p => p.id === action.panelId);
              if (panel) showPanel(panel.title, panel.content);
            } else {
              showToast('UI: ' + (action.action || 'show'), 'success');
            }
            break;
          default:
            showToast(action.type + ' action triggered', 'info');
        }
      });
    }

    // Click handler for 3D hotspots
    renderer.domElement.addEventListener('click', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspotSpheres);
      if (intersects.length > 0) {
        const h = intersects[0].object.userData.hotspot;
        h.behaviors.forEach(b => {
          if (b.trigger === 'onClick') executeActions(b.actions);
        });
      }
    });

    // ─── Scene Navigation (Multi-Scene) ───────────────────
    const scenes = CONFIG.scenes || [];
    if (scenes.length > 1) {
      const nav = document.createElement('div');
      nav.className = 'scene-nav';

      // Track current model/hotspot objects so we can remove them on scene switch
      let currentModelObj = null;
      let currentHotspotSpheres = [...hotspotSpheres];

      function loadScene(sceneConfig) {
        // Remove previous model
        if (currentModelObj) {
          scene.remove(currentModelObj);
          currentModelObj = null;
        }
        // Remove previous hotspot spheres
        currentHotspotSpheres.forEach(s => scene.remove(s));
        currentHotspotSpheres = [];

        // Remove demo scene if present
        if (animObjects) {
          scene.remove(animObjects.group);
          animObjects = null;
        }

        // Apply environment
        const sEnv = sceneConfig.environment || {};
        if (sEnv.type === 'color' && sEnv.color) {
          scene.background = new THREE.Color(sEnv.color);
        } else {
          scene.background = new THREE.Color('#0c1222');
        }
        if (sEnv.intensity !== undefined) {
          renderer.toneMappingExposure = sEnv.intensity;
        }

        // Load scene model or create demo
        const sModel = sceneConfig.model;
        if (sModel && sModel.url) {
          const loader = new GLTFLoader();
          loader.load(
            sModel.url,
            (gltf) => {
              const obj = gltf.scene;
              if (sModel.scale) obj.scale.setScalar(sModel.scale);
              if (sModel.position) obj.position.set(...sModel.position);
              if (sModel.rotation) {
                obj.rotation.set(
                  sModel.rotation[0] * Math.PI / 180,
                  sModel.rotation[1] * Math.PI / 180,
                  sModel.rotation[2] * Math.PI / 180
                );
              }
              scene.add(obj);
              currentModelObj = obj;
            },
            undefined,
            () => {
              animObjects = createDemoScene();
            }
          );
        } else {
          animObjects = createDemoScene();
        }

        // Recreate hotspot spheres for this scene
        const sHotspots = sceneConfig.hotspots || [];
        sHotspots.forEach(h => {
          if (!h.visible) return;
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 16, 16),
            new THREE.MeshStandardMaterial({
              color: theme.hotspotIconColor || '#10b981',
              emissive: theme.hotspotIconColor || '#10b981',
              emissiveIntensity: 0.5
            })
          );
          sphere.position.set(...h.position);
          sphere.userData = { hotspot: h };
          scene.add(sphere);
          currentHotspotSpheres.push(sphere);
        });
      }

      scenes.forEach((s, i) => {
        const btn = document.createElement('button');
        btn.className = 'scene-btn' + (s.id === CONFIG.activeSceneId ? ' active' : '');
        btn.textContent = s.name;
        btn.onclick = () => {
          document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          loadScene(s);
          showToast('Switched to: ' + s.name, 'success');
        };
        nav.appendChild(btn);
      });
      document.body.appendChild(nav);
    }

    // ─── Animation Loop ────────────────────────────────────
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (animObjects) {
        animObjects.group.rotation.y += delta * 0.05;
        if (animObjects.knot) {
          animObjects.knot.rotation.x += delta * 0.3;
          animObjects.knot.rotation.z += delta * 0.2;
        }
      }

      // Animate hotspot spheres
      hotspotSpheres.forEach(sphere => {
        const h = sphere.userData.hotspot;
        if (h.pulseAnimation) {
          const scale = 1 + Math.sin(Date.now() * 0.003) * 0.15;
          sphere.scale.setScalar(scale);
        }
      });

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // ─── Resize Handler ────────────────────────────────────
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`
  }

  const standaloneHtml = generateStandaloneHtml()

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const downloadJson = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '_')}_config.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadHtml = () => {
    const html = generateStandaloneHtml()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!data.projectId && !data.name && !data.hotspots && !data.theme) {
          setImportStatus('error')
          setTimeout(() => setImportStatus('idle'), 3000)
          return
        }
        importProject(data)
        setImportStatus('success')
        setTimeout(() => setImportStatus('idle'), 3000)
      } catch {
        setImportStatus('error')
        setTimeout(() => setImportStatus('idle'), 3000)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-white/5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Export & Import
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Import */}
        <div className="px-3 py-3 border-b border-white/5">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
            Import Project
          </label>
          <button
            onClick={() => importInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium"
          >
            <Upload size={14} />
            Import JSON Config
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          {importStatus === 'success' && (
            <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-[10px]">
              <Check size={12} /> Project imported successfully
            </div>
          )}
          {importStatus === 'error' && (
            <div className="flex items-center gap-1.5 mt-2 text-red-400 text-[10px]">
              <AlertCircle size={12} /> Invalid project file
            </div>
          )}
        </div>

        {/* Download */}
        <div className="px-3 py-3 border-b border-white/5">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
            Download
          </label>
          <div className="space-y-1.5">
            <button
              onClick={downloadJson}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
            >
              <Download size={14} />
              JSON Config
            </button>
            <button
              onClick={downloadHtml}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors text-xs font-medium"
            >
              <Code size={14} />
              Standalone HTML
            </button>
          </div>
          <p className="text-[8px] text-slate-600 mt-2">
            The standalone HTML includes Three.js + OrbitControls + GLTFLoader from CDN with an embedded viewer that works offline.
          </p>
        </div>

        {/* Iframe Embed */}
        <div className="px-3 py-3 border-b border-white/5">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
            Iframe Embed
          </label>
          <div className="relative">
            <pre className="text-[10px] bg-slate-800/50 border border-white/5 rounded-lg p-2 overflow-x-auto text-slate-400 custom-scrollbar">
              {iframeCode}
            </pre>
            <button
              onClick={() => copyToClipboard(iframeCode, 'iframe')}
              className="absolute top-1.5 right-1.5 p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {copied === 'iframe' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* React Component */}
        <div className="px-3 py-3 border-b border-white/5">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
            React Component
          </label>
          <div className="relative">
            <pre className="text-[10px] bg-slate-800/50 border border-white/5 rounded-lg p-2 overflow-x-auto text-slate-400 max-h-32 custom-scrollbar">
              {reactCode.slice(0, 400)}...
            </pre>
            <button
              onClick={() => copyToClipboard(reactCode, 'react')}
              className="absolute top-1.5 right-1.5 p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {copied === 'react' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* JSON Preview */}
        <div className="px-3 py-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">
              JSON Preview
            </label>
            <button
              onClick={() => copyToClipboard(jsonStr, 'json')}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              {copied === 'json' ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
            </button>
          </div>
          <pre className="text-[9px] bg-slate-800/50 border border-white/5 rounded-lg p-2 overflow-auto max-h-48 text-slate-500 custom-scrollbar">
            {jsonStr.slice(0, 1500)}
            {jsonStr.length > 1500 ? '\n...' : ''}
          </pre>
        </div>

        {/* Reset */}
        <div className="px-3 py-3">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset this project? This action cannot be undone.')) {
                resetProject()
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium"
          >
            <RotateCcw size={14} />
            Reset Project
          </button>
        </div>
      </div>
    </div>
  )
}
