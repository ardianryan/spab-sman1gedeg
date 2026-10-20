import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  campus,
  colors,
  onTrace,
  type Layers,
  type Point,
  type Trace,
} from "./model";
export default function Map3D({
  floor: selectedFloor = 1,
  selectedDoor = null,
  activeTargets = ["KU", "K1", "K2"],
  staffOpened = false,
  selected,
  onSelect,
  onDoor,
  layers,
  traces,
  playing,
  epoch,
  onFallback,
}: {
  floor?: number;
  selectedDoor?: string | null;
  activeTargets?: string[];
  staffOpened?: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
  onDoor?: (id: string) => void;
  layers: Layers;
  traces: Trace[];
  playing: boolean;
  epoch: number;
  onFallback: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    [error, setError] = useState("");
  const actions = useRef({
    reset: () => {},
    top: () => {},
    zoom: (_n: number) => {},
    rotate: (_n: number) => {},
  });
  const cameraState = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);
  const time = useRef(0),
    play = useRef(playing),
    invalidate = useRef(() => {}),
    select = useRef(onSelect);
  const selectDoor = useRef(onDoor);
  selectDoor.current = onDoor;
  select.current = onSelect;
  play.current = playing;
  useEffect(() => {
    invalidate.current();
  }, [playing]);
  useEffect(() => {
    time.current = 0;
    invalidate.current();
  }, [epoch]);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      setError("WebGL tidak tersedia.");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(colors.background);
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Model 3D ilustratif sekolah. Gunakan daftar gedung dan kontrol kamera untuk akses keyboard.",
    );
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.minDistance = 5;
    controls.maxDistance = 23;
    controls.maxPolarAngle = Math.PI / 2.1;
    camera.position.copy(
      cameraState.current?.position ?? new THREE.Vector3(7, 12, 10),
    );
    controls.target.copy(
      cameraState.current?.target ?? new THREE.Vector3(0, 0, 0),
    );
    controls.update();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6c7560, 2.4));
    const light = new THREE.DirectionalLight(0xffffff, 2.1);
    light.position.set(-6, 15, -7);
    scene.add(light);
    const world = (p: Point, y = 0) =>
      new THREE.Vector3((p[0] - 650) / 100, y, (p[1] - 550) / 100);
    function polygon(points: Point[], height: number, color: string) {
      const shape = new THREE.Shape(
        points.map(
          (p) => new THREE.Vector2((p[0] - 650) / 100, -(p[1] - 550) / 100),
        ),
      );
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false,
      });
      geo.rotateX(-Math.PI / 2);
      return new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
      );
    }
    const floor = polygon(
      [
        [300, 1038],
        [718, 1038],
        [1010, 78],
        [875, 170],
        [320, 430],
      ],
      0.025,
      "#e7e7dc",
    );
    scene.add(floor);
    for (const g of campus.grounds) {
      const m = polygon(
        g.polygon,
        0.04,
        g.id === "upacara" ? colors.ground : "#d9dcc6",
      );
      scene.add(m);
    }
    if (layers.obstacles)
      for (const o of campus.obstacles)
        scene.add(polygon(o.polygon, 0.085, "#92b27e"));
    function label(text: string, pos: THREE.Vector3, color = "#183f35") {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 96;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fffdf5";
      ctx.fillRect(0, 0, 256, 96);
      ctx.fillStyle = color;
      ctx.font = "bold 52px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text, 128, 66);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          depthTest: false,
          toneMapped: false,
        }),
      );
      sp.scale.set(0.6, 0.225, 1);
      sp.position.copy(pos);
      scene.add(sp);
    }
    const clickable: THREE.Mesh[] = [];
    if (layers.buildings) {
      for (const b of campus.unidentified) {
        const m = polygon(b.polygon, 0.22, "#bbb6a7");
        scene.add(m);
      }
      for (const b of campus.buildings) {
        const height =
          b.floorCount === 2 ? (selectedFloor === 1 ? 0.32 : 0.64) : 0.32;
        const m = polygon(
          b.polygon,
          b.structure === "open" ? 0.025 : height,
          b.id === selected ? colors.selected : "#cc9975",
        );
        if (b.floorCount === 2) {
          m.material.transparent = true;
          m.material.opacity = 0.25;
          m.material.depthWrite = false;
        }
        m.userData.id = b.id;
        scene.add(m);
        clickable.push(m);
        const roof = polygon(
          b.polygon,
          0.045,
          b.id === selected ? "#91432a" : "#a96543",
        );
        roof.position.y = height;
        if (b.floorCount === 2) {
          roof.material.transparent = true;
          roof.material.opacity = 0.15;
          roof.material.depthWrite = false;
        }
        if (b.structure === "open")
          for (const p of b.polygon) {
            const pillar = new THREE.Mesh(
              new THREE.BoxGeometry(0.025, 0.32, 0.025),
              new THREE.MeshStandardMaterial({ color: "#b5afa0" }),
            );
            pillar.position.copy(world(p, 0.16));
            scene.add(pillar);
          }
        roof.userData.id = b.id;
        scene.add(roof);
        clickable.push(roof);
        label(b.code, world(b.label, height + 0.28));
      }
    }
    if (layers.buildings)
      for (const b of campus.access.buildingParts) {
        const m = polygon(
          b.polygon,
          0.32,
          b.buildingId === selected ? colors.selected : "#cc9975",
        );
        m.userData.id = b.buildingId;
        scene.add(m);
        clickable.push(m);
      }
    if (layers.walls) {
      for (const wall of campus.access.walls) {
        scene.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(
              wall.points.map((p) => world(p, 0.38)),
            ),
            new THREE.LineBasicMaterial({ color: "#8e2422" }),
          ),
        );
      }
      const plan = campus.access.floorPlans.find(
        (p) => p.floor === selectedFloor,
      )!;
      for (const wall of plan.walls) {
        const points = wall.map((p) =>
          world(
            [
              564 +
                ((p[0] - (selectedFloor === 1 ? 57 : 14)) * 239) /
                  (selectedFloor === 1 ? 376 : 377),
              401 +
                ((p[1] - (selectedFloor === 1 ? 54 : 44)) * 39) /
                  (selectedFloor === 1 ? 63 : 62),
            ],
            selectedFloor * 0.32 + 0.05,
          ),
        );
        scene.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: "#8e2422" }),
          ),
        );
      }
    }
    if (layers.corridors && activeTargets.includes("KU"))
      for (const edge of campus.access.edges.filter(
        (e) => e.id === "cross-road" || e.id === "gate-approach",
      ))
        scene.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(
              edge.points.map((p) => world(p, 0.08)),
            ),
            new THREE.LineBasicMaterial({ color: "#166978" }),
          ),
        );
    if (layers.doors)
      for (const d of campus.access.doors.filter(
        (d) => !["G", "H"].includes(d.buildingId) || d.floor === selectedFloor,
      )) {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(d.leaves === 2 ? 0.08 : 0.04, 0.11, 0.035),
          new THREE.MeshBasicMaterial({
            color:
              d.id === selectedDoor
                ? "#f6d66d"
                : d.motion === "sliding"
                  ? "#2169a0"
                  : "#40a8a0",
          }),
        );
        m.position.copy(world(d.position, (d.floor - 1) * 0.32 + 0.2));
        m.userData.doorId = d.id;
        clickable.push(m);
        scene.add(m);
      }
    if (layers.stairs)
      for (const side of ["G", "H"]) {
        const n = campus.access.nodes.find((n) => n.id === `stair-${side}-1`)!;
        for (let i = 0; i < 8; i++) {
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.04 * (i + 1), 0.035),
            new THREE.MeshStandardMaterial({ color: "#a8b6aa" }),
          );
          m.position.copy(
            world([n.position[0], n.position[1] + i * 3], 0.02 * (i + 1)),
          );
          scene.add(m);
        }
      }
    if (layers.corridors) {
      const points = [
        world([548, 450], (selectedFloor - 1) * 0.32 + 0.04),
        world([815, 450], (selectedFloor - 1) * 0.32 + 0.04),
      ];
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({ color: "#166978" }),
        ),
      );
    }
    if (layers.gates)
      for (const g of campus.access.gates)
        label(
          g.id === "gate-left"
            ? "Kiri"
            : staffOpened
              ? "Kanan buka"
              : "Kanan tutup",
          world(g.position, 0.2),
        );
    if (layers.destinations)
      for (const d of campus.destinations.filter(
        () => activeTargets.length > 0,
      ))
        label(
          d.id,
          world(d.position, 0.27),
          activeTargets.includes(d.id) ? "#183f35" : "#68755d",
        );
    const arrows: { mesh: THREE.Mesh; trace: Trace; offset: number }[] = [];
    if (layers.traces)
      for (const t of traces) {
        const color = t.category === "utama" ? colors.main : colors.alternate;
        for (let i = 1; i < t.points.length; i++) {
          const a = world(t.points[i - 1], 0.08),
            b = world(t.points[i], 0.08),
            length = a.distanceTo(b);
          const segments =
            t.category === "alternatif"
              ? Math.max(1, Math.ceil(length / 0.14))
              : 1;
          for (let j = 0; j < segments; j++) {
            const start = a.clone().lerp(b, j / segments),
              end = a
                .clone()
                .lerp(
                  b,
                  (j + (t.category === "alternatif" ? 0.65 : 1)) / segments,
                );
            const geo = new THREE.CylinderGeometry(
                0.018,
                0.018,
                start.distanceTo(end),
                6,
              ),
              m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color }));
            m.position.copy(start.clone().add(end).multiplyScalar(0.5));
            m.quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              end.sub(start).normalize(),
            );
            scene.add(m);
          }
        }
        for (const offset of [0.1, 0.4, 0.7, 0.98]) {
          const m = new THREE.Mesh(
            new THREE.ConeGeometry(0.055, 0.14, 3),
            new THREE.MeshBasicMaterial({ color }),
          );
          scene.add(m);
          arrows.push({ mesh: m, trace: t, offset });
        }
      }
    let frame = 0,
      last = performance.now(),
      disposed = false;
    function render(now: number) {
      frame = 0;
      if (disposed) return;
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (play.current) time.current += delta;
      for (const a of arrows) {
        const p = onTrace(a.trace.points, (a.offset + time.current * 0.04) % 1);
        a.mesh.position.copy(world([p.x, p.y], 0.12));
        a.mesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(
            Math.cos((p.angle * Math.PI) / 180),
            0,
            Math.sin((p.angle * Math.PI) / 180),
          ),
        );
      }
      renderer.render(scene, camera);
      if (play.current && arrows.length) frame = requestAnimationFrame(render);
    }
    function request() {
      if (!frame && !disposed) {
        last = performance.now();
        frame = requestAnimationFrame(render);
      }
    }
    invalidate.current = request;
    controls.addEventListener("change", request);
    const resize = new ResizeObserver(() => {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      request();
    });
    resize.observe(el);
    const ray = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let down = { x: 0, y: 0 };
    const pointerDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const pick = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      const r = el.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(clickable)[0];
      if (hit) {
        if (hit.object.userData.doorId)
          selectDoor.current?.(hit.object.userData.doorId);
        else select.current(hit.object.userData.id);
      }
    };
    const lost = (e: Event) => {
      e.preventDefault();
      setError("Konteks grafis tidak tersedia.");
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pick);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    actions.current = {
      reset: () => {
        camera.position.set(7, 12, 10);
        controls.target.set(0, 0, 0);
        controls.update();
        request();
      },
      top: () => {
        camera.position.set(0, 16, 0.01);
        controls.target.set(0, 0, 0);
        controls.update();
        request();
      },
      zoom: (n) => {
        const offset = camera.position
          .clone()
          .sub(controls.target)
          .multiplyScalar(n);
        offset.clampLength(5, 23);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        request();
      },
      rotate: (n) => {
        const offset = camera.position.clone().sub(controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), n);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        request();
      },
    };
    request();
    return () => {
      cameraState.current = {
        position: camera.position.clone(),
        target: controls.target.clone(),
      };
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pick);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            const texture = (mat as THREE.SpriteMaterial).map;
            texture?.dispose();
            mat.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      invalidate.current = () => {};
    };
  }, [
    selected,
    layers,
    traces,
    selectedFloor,
    selectedDoor,
    activeTargets.join(","),
    staffOpened,
  ]);
  if (error)
    return (
      <div className="map-error" role="status">
        <h3>3D tidak tersedia di perangkat ini</h3>
        <p>Peta 2D dan daftar gedung tetap dapat digunakan.</p>
        <button onClick={onFallback}>Kembali ke peta 2D</button>
      </div>
    );
  return (
    <div className="map3d">
      <div className="three-host" ref={host} />
      <div className="three-tools">
        <button
          onClick={() => actions.current.zoom(0.85)}
          aria-label="Perbesar 3D"
        >
          +
        </button>
        <button
          onClick={() => actions.current.zoom(1.15)}
          aria-label="Perkecil 3D"
        >
          −
        </button>
        <button
          onClick={() => actions.current.rotate(-Math.PI / 8)}
          aria-label="Putar ke kiri"
        >
          ↶
        </button>
        <button
          onClick={() => actions.current.rotate(Math.PI / 8)}
          aria-label="Putar ke kanan"
        >
          ↷
        </button>
        <button onClick={() => actions.current.top()}>Dari atas</button>
        <button onClick={() => actions.current.reset()}>Reset</button>
      </div>
      <span className="map-scale">
        Tinggi ilustratif · Pilih gedung untuk menyorot
      </span>
    </div>
  );
}
