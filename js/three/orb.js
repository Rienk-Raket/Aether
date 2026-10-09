// The 3D orb (Three.js): participants on the surface, candidate places floating inside.
// The length of a line is a travel time; a fair place floats in the middle (see core/orb-layout.js).
// Loaded on demand by ui/map-view.js. Throws when WebGL is not available, so the caller can fall
// back to the flat 2D map.

import * as THREE from '../../vendor/three.module.js';
import { layoutOrb } from '../core/orb-layout.js';
import { initials, hueFor } from '../ui/dom.js';

const MINT = 0x9df0cf;
const BLUE = 0x88b9ff;
const ASPECT = 0.75; // height / width
const MIN_DISTANCE = 3.2; // closest the camera may zoom
const MAX_DISTANCE = 6.6; // furthest the camera may zoom

// A round label with initials, drawn on a canvas and used as a sprite texture.
function labelTexture(text, hue) {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  g.fillStyle = `hsl(${hue} 55% 60%)`;
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 6;
  g.strokeStyle = '#071a28';
  g.stroke();
  g.fillStyle = '#17202a';
  g.font = '700 38px "Space Grotesk", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, size / 2, size / 2 + 2);
  return new THREE.CanvasTexture(canvas);
}

// Latitude and longitude circles every 30 degrees: a calm grid instead of a dense mesh.
function gridGeometry() {
  const points = [];
  const steps = 64;
  for (let ring = 0; ring < 12; ring++) {
    const angle = (ring * Math.PI) / 6;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const b = ((i + 1) / steps) * Math.PI * 2;
      // meridians (every 30 degrees around the vertical axis)
      points.push(new THREE.Vector3(Math.cos(a) * Math.sin(angle), Math.sin(a), Math.cos(a) * Math.cos(angle)), new THREE.Vector3(Math.cos(b) * Math.sin(angle), Math.sin(b), Math.cos(b) * Math.cos(angle)));
      // latitude circles (only the first five rings: -60 … +60 degrees)
      if (ring > 0 && ring < 6) {
        const lat = (ring - 3) * (Math.PI / 6);
        points.push(new THREE.Vector3(Math.cos(lat) * Math.cos(a), Math.sin(lat), Math.cos(lat) * Math.sin(a)), new THREE.Vector3(Math.cos(lat) * Math.cos(b), Math.sin(lat), Math.cos(lat) * Math.sin(b)));
      }
    }
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function haloTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  g.strokeStyle = '#9df0cf';
  g.lineWidth = 6;
  g.setLineDash([10, 8]);
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
  g.stroke();
  return new THREE.CanvasTexture(canvas);
}

// participants: [{ id, name }]; candidates: ALL candidates [{ id, times }] (fixes the layout)
// options: { reducedMotion, onSelect(id) }
export function createOrb(container, { participants, candidates }, { reducedMotion = false, onSelect } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  if (!renderer.getContext()) throw new Error('WebGL not available');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.className = 'orb-canvas';
  container.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1 / ASPECT, 0.1, 50);
  camera.position.set(0, 0.15, 4.6);
  const world = new THREE.Group();
  world.rotation.x = 0.25;
  scene.add(world);

  // The orb itself: a faint glass sphere with a wire grid, and a small ring for "the middle".
  world.add(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), new THREE.MeshBasicMaterial({ color: 0x102638, transparent: true, opacity: 0.35, depthWrite: false })));
  world.add(new THREE.LineSegments(gridGeometry(), new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.22 })));
  const middle = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.065, 32), new THREE.MeshBasicMaterial({ color: MINT, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
  world.add(middle);

  const layout = layoutOrb(participants.length, candidates);
  const disposables = [];

  participants.forEach((person, i) => {
    const texture = labelTexture(initials(person.name), hueFor(person.id));
    disposables.push(texture);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
    sprite.position.set(...layout.points[i]);
    sprite.scale.setScalar(0.3);
    sprite.renderOrder = 3;
    world.add(sprite);
  });

  const sphereGeometry = new THREE.SphereGeometry(1, 20, 14);
  const meshes = new Map();
  for (const candidate of candidates) {
    const mesh = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({ color: BLUE }));
    mesh.position.set(...layout.positions.get(candidate.id));
    mesh.userData.id = candidate.id;
    mesh.visible = false;
    world.add(mesh);
    meshes.set(candidate.id, mesh);
  }

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), depthTest: false, transparent: true }));
  halo.renderOrder = 2;
  halo.visible = false;
  world.add(halo);
  disposables.push(halo.material.map);

  const lines = participants.map((person) => {
    const material = new THREE.LineBasicMaterial({ color: new THREE.Color().setHSL(hueFor(person.id) / 360, 0.75, 0.7), transparent: true, opacity: 0.85 });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), material);
    line.visible = false;
    world.add(line);
    return line;
  });

  const caption = document.createElement('div');
  caption.className = 'orb-caption';
  caption.setAttribute('aria-live', 'polite');
  container.append(caption);

  let selectedMesh = null;
  let ranked = [];

  // ranked: best-first [{ id, name, fairness }]; text: caption for the selected place
  function update({ candidates: rankedNow, selectedId, label, description }) {
    ranked = rankedNow;
    for (const mesh of meshes.values()) mesh.visible = false;
    rankedNow.forEach((c, i) => {
      const mesh = meshes.get(c.id);
      if (!mesh) return;
      mesh.visible = true;
      mesh.scale.setScalar(0.06 + 0.08 * c.fairness);
      mesh.material.color.setHex(i === 0 ? MINT : BLUE);
    });

    selectedMesh = meshes.get(selectedId) ?? null;
    halo.visible = Boolean(selectedMesh);
    if (selectedMesh) {
      halo.position.copy(selectedMesh.position);
      lines.forEach((line, i) => {
        line.geometry.setFromPoints([new THREE.Vector3(...layout.points[i]), selectedMesh.position]);
        line.visible = true;
      });
    } else {
      lines.forEach((line) => (line.visible = false));
    }
    caption.textContent = label ?? '';
    canvas.setAttribute('aria-label', description ?? label ?? '');
  }

  // Dragging turns the orb; a tap (little movement) selects the place under the finger.
  const raycaster = new THREE.Raycaster();
  let drag = null;
  canvas.addEventListener('pointerdown', (event) => {
    drag = { x: event.clientX, y: event.clientY, moved: 0 };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.x = event.clientX;
    drag.y = event.clientY;
    world.rotation.y += dx * 0.008;
    world.rotation.x = Math.max(-1, Math.min(1, world.rotation.x + dy * 0.008));
  });
  // The page must not scroll while the visitor navigates inside the view: the wheel zooms the
  // orb instead (CSS keeps touch swipes from scrolling the page, see .orb-canvas).
  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      camera.position.z = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, camera.position.z + event.deltaY * 0.004));
    },
    { passive: false },
  );
  canvas.addEventListener('pointercancel', () => {
    drag = null;
  });
  canvas.addEventListener('pointerup', (event) => {
    const tapped = drag && drag.moved < 5;
    drag = null;
    if (!tapped) return;
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1)), camera);
    const hit = raycaster.intersectObjects([...meshes.values()].filter((m) => m.visible), false)[0];
    if (hit) onSelect?.(hit.object.userData.id);
  });

  function resize() {
    const width = container.clientWidth || 400;
    renderer.setSize(width, Math.round(width * ASPECT), false);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  let frame = 0;
  let stopped = false;
  function dispose() {
    stopped = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
    canvas.remove();
    caption.remove();
  }

  function loop(time) {
    if (stopped) return;
    if (!container.isConnected) return dispose(); // the screen was replaced
    frame = requestAnimationFrame(loop);
    if (document.hidden) return;
    if (!reducedMotion && !drag) world.rotation.y += 0.0018;
    if (selectedMesh) {
      const pulse = reducedMotion ? 1 : 1 + 0.12 * Math.sin(time / 350);
      halo.scale.setScalar((selectedMesh.scale.x * 4 + 0.12) * pulse);
    }
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(loop);

  return { update, dispose, get ranked() { return ranked; } };
}
