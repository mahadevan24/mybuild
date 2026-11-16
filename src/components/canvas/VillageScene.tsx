"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PlacedBuilding, BuildingType } from "@/types/game";
import { BUILDING_DEFINITIONS, GRID_SIZE } from "@/constants/buildings";
import { createBuildingModel } from "./models";
import { sounds } from "@/utils/audio";

interface VillageSceneProps {
  buildings: PlacedBuilding[];
  selectedBuildingId: string | null;
  onSelectBuilding: (building: PlacedBuilding | null) => void;
  placementMode: {
    active: boolean;
    buildingType: BuildingType | null;
  };
  onPlaceBuilding: (x: number, z: number) => void;
  onCollectResource: (buildingId: string) => void;
}

export default function VillageScene({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  placementMode,
  onPlaceBuilding,
  onCollectResource,
}: VillageSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References to keep Three.js state outside React render cycles
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const buildingMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const hoverIndicatorRef = useRef<THREE.Mesh | null>(null);
  const selectionRingRef = useRef<THREE.Mesh | null>(null);
  const hammerMeshRef = useRef<Map<string, THREE.Group>>(new Map());

  // Mouse pan and drag interaction state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3(25, 28, 25));
  const zoomLevelRef = useRef<number>(45);

  const [hoverTile, setHoverTile] = useState<{ x: number; z: number } | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e3a1f); // Lush dark forest backdrop
    sceneRef.current = scene;

    // 2. Isometric Orthographic Camera
    const aspect = width / height;
    const frustumSize = zoomLevelRef.current;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      200
    );
    camera.position.set(25, 28, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer with soft shadows
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lighting (Warm sunlight + skylight for vibrant CoC style)
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfef08a, 1.2);
    sunLight.position.set(30, 45, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Subtle blue fill light from opposite angle
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.4);
    fillLight.position.set(-20, 15, -25);
    scene.add(fillLight);

    // 5. Build Village Grid Terrain & Perimeter
    buildTerrain(scene);

    // 6. Hover & Selection Indicators
    const hoverGeo = new THREE.PlaneGeometry(1, 1);
    hoverGeo.rotateX(-Math.PI / 2);
    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const hoverMesh = new THREE.Mesh(hoverGeo, hoverMat);
    hoverMesh.position.y = 0.05;
    hoverMesh.visible = false;
    scene.add(hoverMesh);
    hoverIndicatorRef.current = hoverMesh;

    const selectGeo = new THREE.RingGeometry(1.2, 1.45, 32);
    selectGeo.rotateX(-Math.PI / 2);
    const selectMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const selectRing = new THREE.Mesh(selectGeo, selectMat);
    selectRing.position.y = 0.06;
    selectRing.visible = false;
    scene.add(selectRing);
    selectionRingRef.current = selectRing;

    // 7. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Animate floating indicators (uncollected bubble, builder hammer)
      hammerMeshRef.current.forEach((hammer) => {
        hammer.rotation.z = Math.sin(elapsed * 6) * 0.4;
        hammer.position.y = 2.4 + Math.abs(Math.sin(elapsed * 3)) * 0.2;
      });

      // Animate pulse on selection ring
      if (selectionRingRef.current && selectionRingRef.current.visible) {
        const pulse = 1 + Math.sin(elapsed * 4) * 0.06;
        selectionRingRef.current.scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      const newAspect = newW / newH;
      const f = zoomLevelRef.current;

      cameraRef.current.left = (-f * newAspect) / 2;
      cameraRef.current.right = (f * newAspect) / 2;
      cameraRef.current.top = f / 2;
      cameraRef.current.bottom = -f / 2;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Buildings in Scene whenever `buildings` state changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMap = buildingMeshesRef.current;
    const existingIds = new Set(currentMap.keys());
    const newIds = new Set(buildings.map((b) => b.id));

    // Remove deleted buildings
    existingIds.forEach((id) => {
      if (!newIds.has(id)) {
        const mesh = currentMap.get(id);
        if (mesh) {
          scene.remove(mesh);
          currentMap.delete(id);
        }
        const hammer = hammerMeshRef.current.get(id);
        if (hammer) {
          scene.remove(hammer);
          hammerMeshRef.current.delete(id);
        }
      }
    });

    // Add or update buildings
    buildings.forEach((b) => {
      const def = BUILDING_DEFINITIONS[b.type];
      const posX = b.x - GRID_SIZE / 2 + (def?.size[0] || 2) / 2;
      const posZ = b.z - GRID_SIZE / 2 + (def?.size[1] || 2) / 2;

      let mesh = currentMap.get(b.id);
      const isUpgrading = !!b.isUpgrading;

      // Re-create mesh if level changed or upgrading state changed
      if (!mesh || mesh.userData.level !== b.level || mesh.userData.isUpgrading !== isUpgrading) {
        if (mesh) scene.remove(mesh);
        mesh = createBuildingModel(b.type, b.level, isUpgrading);
        mesh.userData = { id: b.id, level: b.level, isUpgrading, building: b };
        scene.add(mesh);
        currentMap.set(b.id, mesh);
      }

      mesh.position.set(posX, 0, posZ);

      // Handle animated builder hammer above upgrading building
      let hammer = hammerMeshRef.current.get(b.id);
      if (isUpgrading) {
        if (!hammer) {
          hammer = createAnimatedHammer();
          scene.add(hammer);
          hammerMeshRef.current.set(b.id, hammer);
        }
        hammer.position.set(posX, 2.5, posZ);
      } else if (hammer) {
        scene.remove(hammer);
        hammerMeshRef.current.delete(b.id);
      }
    });
  }, [buildings]);

  // Update Selection Ring Position
  useEffect(() => {
    const ring = selectionRingRef.current;
    if (!ring) return;

    if (!selectedBuildingId) {
      ring.visible = false;
      return;
    }

    const b = buildings.find((x) => x.id === selectedBuildingId);
    if (!b) {
      ring.visible = false;
      return;
    }

    const def = BUILDING_DEFINITIONS[b.type];
    const size = def?.size[0] || 2;
    const posX = b.x - GRID_SIZE / 2 + size / 2;
    const posZ = b.z - GRID_SIZE / 2 + size / 2;

    ring.position.set(posX, 0.06, posZ);
    ring.scale.set(size * 0.9, size * 0.9, size * 0.9);
    ring.visible = true;
  }, [selectedBuildingId, buildings]);

  // Raycasting for Tile Hover and Click Selection
  const getGridTileFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // Intersect horizontal ground plane Y = 0
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(plane, target);

    if (hit) {
      const tileX = Math.floor(target.x + GRID_SIZE / 2);
      const tileZ = Math.floor(target.z + GRID_SIZE / 2);
      if (tileX >= 0 && tileX < GRID_SIZE && tileZ >= 0 && tileZ < GRID_SIZE) {
        return { x: tileX, z: tileZ };
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Detect drag pan
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (e.buttons === 1 || e.buttons === 2) {
      if (Math.hypot(dx, dy) > 4) {
        isDraggingRef.current = true;
        panCamera(dx, dy);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    }

    // Hover Indicator
    const tile = getGridTileFromEvent(e);
    setHoverTile(tile);

    if (hoverIndicatorRef.current && tile) {
      const size = placementMode.active && placementMode.buildingType
        ? BUILDING_DEFINITIONS[placementMode.buildingType]?.size[0] || 1
        : 1;

      hoverIndicatorRef.current.position.set(
        tile.x - GRID_SIZE / 2 + size / 2,
        0.05,
        tile.z - GRID_SIZE / 2 + size / 2
      );
      hoverIndicatorRef.current.scale.set(size, size, size);
      hoverIndicatorRef.current.visible = true;

      // Color green if valid, red if blocked
      const blocked = isTileBlocked(tile.x, tile.z, size);
      const mat = hoverIndicatorRef.current.material as THREE.MeshBasicMaterial;
      mat.color.setHex(blocked ? 0xef4444 : 0x22c55e);
    } else if (hoverIndicatorRef.current) {
      hoverIndicatorRef.current.visible = false;
    }
  };

  const isTileBlocked = (x: number, z: number, size: number = 1): boolean => {
    if (x < 1 || z < 1 || x + size > GRID_SIZE - 1 || z + size > GRID_SIZE - 1) return true;
    for (const b of buildings) {
      if (b.id === selectedBuildingId && !placementMode.active) continue;
      const bDef = BUILDING_DEFINITIONS[b.type];
      const bW = bDef?.size[0] || 2;
      const bH = bDef?.size[1] || 2;

      // Check bounding box intersection
      if (x < b.x + bW && x + size > b.x && z < b.z + bH && z + size > b.z) {
        return true;
      }
    }
    return false;
  };

  const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    const tile = getGridTileFromEvent(e);
    if (!tile) return;

    if (placementMode.active && placementMode.buildingType) {
      const size = BUILDING_DEFINITIONS[placementMode.buildingType]?.size[0] || 2;
      if (!isTileBlocked(tile.x, tile.z, size)) {
        onPlaceBuilding(tile.x, tile.z);
        sounds.playBuildPlace();
      } else {
        sounds.playError();
      }
      return;
    }

    // Check if clicked directly on an existing building
    let clickedBuilding: PlacedBuilding | null = null;
    for (const b of buildings) {
      const def = BUILDING_DEFINITIONS[b.type];
      const w = def?.size[0] || 2;
      const l = def?.size[1] || 2;
      if (tile.x >= b.x && tile.x < b.x + w && tile.z >= b.z && tile.z < b.z + l) {
        clickedBuilding = b;
        break;
      }
    }

    if (clickedBuilding) {
      sounds.playClick();
      onSelectBuilding(clickedBuilding);

      // If building has uncollected resources, collect immediately!
      if (clickedBuilding.uncollectedResources && clickedBuilding.uncollectedResources > 0) {
        onCollectResource(clickedBuilding.id);
        sounds.playCollect();
      }
    } else {
      onSelectBuilding(null);
    }
  };

  const panCamera = (deltaX: number, deltaY: number) => {
    if (!cameraRef.current) return;
    const factor = zoomLevelRef.current * 0.0018;

    // Isometric isometric projection delta mapping
    const moveX = (deltaX - deltaY) * factor;
    const moveZ = (-deltaX - deltaY) * factor;

    cameraTargetRef.current.x -= moveX;
    cameraTargetRef.current.z -= moveZ;

    // Clamp camera within village limits
    cameraTargetRef.current.x = Math.max(-12, Math.min(12, cameraTargetRef.current.x));
    cameraTargetRef.current.z = Math.max(-12, Math.min(12, cameraTargetRef.current.z));

    updateCameraPosition();
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!cameraRef.current || !containerRef.current) return;
    e.preventDefault();

    const zoomDelta = e.deltaY * 0.05;
    zoomLevelRef.current = Math.max(20, Math.min(65, zoomLevelRef.current + zoomDelta));

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const aspect = width / height;
    const f = zoomLevelRef.current;

    cameraRef.current.left = (-f * aspect) / 2;
    cameraRef.current.right = (f * aspect) / 2;
    cameraRef.current.top = f / 2;
    cameraRef.current.bottom = -f / 2;
    cameraRef.current.updateProjectionMatrix();
  };

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.set(
      cameraTargetRef.current.x + cameraOffsetRef.current.x,
      cameraOffsetRef.current.y,
      cameraTargetRef.current.z + cameraOffsetRef.current.z
    );
    cameraRef.current.lookAt(cameraTargetRef.current);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full block"
      />

      {/* Isometric Zoom & Center Controls */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-2 z-10">
        <button
          onClick={() => {
            zoomLevelRef.current = Math.max(20, zoomLevelRef.current - 8);
            if (cameraRef.current && containerRef.current) {
              const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
              const f = zoomLevelRef.current;
              cameraRef.current.left = (-f * aspect) / 2;
              cameraRef.current.right = (f * aspect) / 2;
              cameraRef.current.top = f / 2;
              cameraRef.current.bottom = -f / 2;
              cameraRef.current.updateProjectionMatrix();
            }
            sounds.playClick();
          }}
          className="w-10 h-10 bg-slate-900/80 hover:bg-slate-800 text-amber-400 font-bold text-xl rounded-lg border border-amber-500/40 shadow-coc flex items-center justify-center transition active:scale-95"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => {
            zoomLevelRef.current = Math.min(65, zoomLevelRef.current + 8);
            if (cameraRef.current && containerRef.current) {
              const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
              const f = zoomLevelRef.current;
              cameraRef.current.left = (-f * aspect) / 2;
              cameraRef.current.right = (f * aspect) / 2;
              cameraRef.current.top = f / 2;
              cameraRef.current.bottom = -f / 2;
              cameraRef.current.updateProjectionMatrix();
            }
            sounds.playClick();
          }}
          className="w-10 h-10 bg-slate-900/80 hover:bg-slate-800 text-amber-400 font-bold text-xl rounded-lg border border-amber-500/40 shadow-coc flex items-center justify-center transition active:scale-95"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={() => {
            cameraTargetRef.current.set(0, 0, 0);
            updateCameraPosition();
            sounds.playClick();
          }}
          className="w-10 h-10 bg-slate-900/80 hover:bg-slate-800 text-amber-400 text-xs rounded-lg border border-amber-500/40 shadow-coc flex items-center justify-center transition active:scale-95"
          title="Recenter Village"
        >
          🎯
        </button>
      </div>
    </div>
  );
}

// ---------------- Helper Three.js Setup ----------------

function buildTerrain(scene: THREE.Scene) {
  // Checkered green village field
  const grassMat1 = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.95 });
  const grassMat2 = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.95 });
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x245a27, roughness: 1.0 });

  // Main grid tiles
  const tileGeo = new THREE.PlaneGeometry(1, 1);
  tileGeo.rotateX(-Math.PI / 2);

  const gridGroup = new THREE.Group();
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
      const isEven = (x + z) % 2 === 0;
      const tile = new THREE.Mesh(tileGeo, isEven ? grassMat1 : grassMat2);
      tile.position.set(x - GRID_SIZE / 2 + 0.5, 0, z - GRID_SIZE / 2 + 0.5);
      tile.receiveShadow = true;
      gridGroup.add(tile);
    }
  }
  scene.add(gridGroup);

  // Outer border plateau
  const borderGround = new THREE.Mesh(
    new THREE.BoxGeometry(GRID_SIZE + 16, 0.4, GRID_SIZE + 16),
    borderMat
  );
  borderGround.position.y = -0.21;
  borderGround.receiveShadow = true;
  scene.add(borderGround);

  // Perimeter Trees & Rocks for Clash of Clans Village charm
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });

  const treeGeoCone = new THREE.ConeGeometry(0.7, 1.4, 6);
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.6, 6);
  const rockGeo = new THREE.DodecahedronGeometry(0.45);

  const placeTree = (x: number, z: number) => {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.3;
    trunk.castShadow = true;
    tree.add(trunk);

    const foliage = new THREE.Mesh(treeGeoCone, treeMat);
    foliage.position.y = 1.1;
    foliage.castShadow = true;
    tree.add(foliage);

    tree.position.set(x, 0, z);
    scene.add(tree);
  };

  const placeRock = (x: number, z: number) => {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(x, 0.2, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    scene.add(rock);
  };

  // Border positions around the 22x22 perimeter
  const borderOffset = GRID_SIZE / 2 + 1.8;
  for (let i = -borderOffset; i <= borderOffset; i += 2.2) {
    placeTree(i, -borderOffset);
    placeTree(i, borderOffset);
    placeTree(-borderOffset, i);
    placeTree(borderOffset, i);

    if (Math.random() > 0.4) {
      placeRock(i + 0.8, -borderOffset - 1.2);
      placeRock(i - 0.8, borderOffset + 1.2);
    }
  }
}

function createAnimatedHammer(): THREE.Group {
  const g = new THREE.Group();
  g.name = "builder_hammer";

  // Wooden handle
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x854d0e })
  );
  handle.position.y = 0.3;
  g.add(handle);

  // Steel hammer head
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.14, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
  );
  head.position.y = 0.55;
  g.add(head);

  return g;
}
