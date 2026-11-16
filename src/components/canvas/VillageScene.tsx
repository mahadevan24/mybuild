"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PlacedBuilding, BuildingType } from "@/types/game";
import { BUILDING_DEFINITIONS, GRID_SIZE } from "@/constants/buildings";
import { createBuildingModel, materials } from "./models";
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

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const buildingMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const hoverIndicatorRef = useRef<THREE.Mesh | null>(null);
  const selectionGroupRef = useRef<THREE.Group | null>(null);
  const hammerMeshRef = useRef<Map<string, THREE.Group>>(new Map());
  const resourceFloatersRef = useRef<Map<string, THREE.Group>>(new Map());

  // Mouse pan and smooth camera interpolation
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const desiredTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3(26, 30, 26));
  const zoomLevelRef = useRef<number>(44);
  const desiredZoomRef = useRef<number>(44);

  const [hoverTile, setHoverTile] = useState<{ x: number; z: number } | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene with atmospheric forest fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x122419); // Rich dark emerald forest ambiance
    scene.fog = new THREE.FogExp2(0x122419, 0.009);
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
      250
    );
    camera.position.set(26, 30, 26);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. High-Quality WebGL Renderer (ACESFilmic + sRGB + PCFSoftShadows)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));

    // Cinematic Color Grading
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    // Soft Shadow Mapping
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lighting Rig
    // Balanced Hemisphere Light (Warm sky light + green terrain bounce)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x166534, 0.85);
    scene.add(hemiLight);

    // Warm Sun Directional Light
    const sunLight = new THREE.DirectionalLight(0xfff8db, 1.35);
    sunLight.position.set(28, 42, 22);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 110;
    sunLight.shadow.camera.left = -26;
    sunLight.shadow.camera.right = 26;
    sunLight.shadow.camera.top = 26;
    sunLight.shadow.camera.bottom = -26;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    // Subtle Cyan Rim/Silhouette Light
    const rimLight = new THREE.DirectionalLight(0xa5f3fc, 0.45);
    rimLight.position.set(-22, 18, -25);
    scene.add(rimLight);

    // 5. Build Lush Seamless Village Terrain (No Checkerboard!)
    buildLushTerrain(scene);

    // 6. Placement & Hover Indicator
    const hoverGeo = new THREE.PlaneGeometry(1, 1);
    hoverGeo.rotateX(-Math.PI / 2);
    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const hoverMesh = new THREE.Mesh(hoverGeo, hoverMat);
    hoverMesh.position.y = 0.04;
    hoverMesh.visible = false;
    scene.add(hoverMesh);
    hoverIndicatorRef.current = hoverMesh;

    // 7. Stylish Glowing Selection Indicator Group
    const selGroup = createSelectionGroup();
    selGroup.visible = false;
    scene.add(selGroup);
    selectionGroupRef.current = selGroup;

    // 8. Animation Render Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera interpolation (lerp)
      currentTargetRef.current.lerp(desiredTargetRef.current, 0.1);
      if (Math.abs(zoomLevelRef.current - desiredZoomRef.current) > 0.05) {
        zoomLevelRef.current += (desiredZoomRef.current - zoomLevelRef.current) * 0.12;
        if (cameraRef.current && containerRef.current) {
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          const asp = w / h;
          const f = zoomLevelRef.current;
          cameraRef.current.left = (-f * asp) / 2;
          cameraRef.current.right = (f * asp) / 2;
          cameraRef.current.top = f / 2;
          cameraRef.current.bottom = -f / 2;
          cameraRef.current.updateProjectionMatrix();
        }
      }

      // Update camera position looking at interpolated target
      camera.position.set(
        currentTargetRef.current.x + cameraOffsetRef.current.x,
        cameraOffsetRef.current.y,
        currentTargetRef.current.z + cameraOffsetRef.current.z
      );
      camera.lookAt(currentTargetRef.current);

      // Animate procedural parts inside building models
      buildingMeshesRef.current.forEach((group) => {
        group.traverse((child) => {
          const u = child.userData;
          if (!u || !u.animType) return;

          switch (u.animType) {
            case "pistonBob":
              child.position.y = u.basePosY + Math.sin(elapsed * 4) * (u.stroke || 0.15);
              break;
            case "fluidPulse":
              child.scale.y = 1 + Math.sin(elapsed * 2.5) * 0.05;
              break;
            case "rotateZ":
              child.rotation.x += 0.04 * (u.speed || 1);
              break;
            case "levitateSpin":
              child.position.y = u.basePosY + Math.sin(elapsed * 2) * 0.08;
              child.rotation.y = elapsed * 0.8;
              break;
            case "floatPulse":
              child.position.y = u.basePosY + Math.sin(elapsed * 3) * 0.06;
              break;
            case "flameFlicker": {
              const flicker = 1 + Math.sin(elapsed * 12) * 0.12;
              child.scale.set(flicker, 1 + Math.cos(elapsed * 15) * 0.15, flicker);
              break;
            }
            case "punchDummySway":
              child.rotation.z = Math.sin(elapsed * 3) * 0.08;
              break;
            case "astrolabeOrbit":
              child.rotation.y = elapsed * 0.5;
              break;
            case "bellSway":
              child.rotation.z = Math.sin(elapsed * 2) * 0.15;
              break;
          }
        });
      });

      // Animate Upgrading Builder Hammer (striking arc)
      hammerMeshRef.current.forEach((hammer) => {
        // Strike rhythm: cycle every 0.9s
        const cycle = (elapsed % 0.9) / 0.9;
        const strikeAngle = Math.sin(cycle * Math.PI) * 0.7;
        hammer.rotation.z = -0.3 + strikeAngle;
        hammer.position.y = 2.4 + Math.sin(cycle * Math.PI) * 0.25;
      });

      // Animate Floating Resource Collect Bubbles
      resourceFloatersRef.current.forEach((floater) => {
        floater.position.y = 2.8 + Math.sin(elapsed * 3) * 0.15;
        floater.rotation.y = elapsed * 2.0;
      });

      // Animate Selection Bracket Glow
      if (selectionGroupRef.current && selectionGroupRef.current.visible) {
        const ring = selectionGroupRef.current.getObjectByName("sel_ring");
        const brackets = selectionGroupRef.current.getObjectByName("sel_brackets");
        if (ring) {
          const pulse = 1 + Math.sin(elapsed * 4) * 0.05;
          ring.scale.set(pulse, pulse, pulse);
        }
        if (brackets) {
          brackets.rotation.y = elapsed * 0.8;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Handler
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

  // Update Buildings and Floating Resource Badges
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMap = buildingMeshesRef.current;
    const existingIds = new Set(currentMap.keys());
    const newIds = new Set(buildings.map((b) => b.id));

    // Remove obsolete buildings
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
        const floater = resourceFloatersRef.current.get(id);
        if (floater) {
          scene.remove(floater);
          resourceFloatersRef.current.delete(id);
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

      if (!mesh || mesh.userData.level !== b.level || mesh.userData.isUpgrading !== isUpgrading) {
        if (mesh) scene.remove(mesh);
        mesh = createBuildingModel(b.type, b.level, isUpgrading);
        mesh.userData = { id: b.id, level: b.level, isUpgrading, building: b };
        scene.add(mesh);
        currentMap.set(b.id, mesh);
      }

      mesh.position.set(posX, 0, posZ);

      // Builder Hammer above upgrading building
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

      // Floating 3D Collect Badges for mines & collectors with unharvested loot!
      let floater = resourceFloatersRef.current.get(b.id);
      const hasUncollected = b.uncollectedResources && b.uncollectedResources > 0;

      if (hasUncollected) {
        if (!floater) {
          floater = createResourceFloater(b.type === "gold_mine" ? "gold" : "elixir");
          scene.add(floater);
          resourceFloatersRef.current.set(b.id, floater);
        }
        floater.position.set(posX, 2.8, posZ);
      } else if (floater) {
        scene.remove(floater);
        resourceFloatersRef.current.delete(b.id);
      }
    });
  }, [buildings]);

  // Update Selection Indicator
  useEffect(() => {
    const selGroup = selectionGroupRef.current;
    if (!selGroup) return;

    if (!selectedBuildingId) {
      selGroup.visible = false;
      return;
    }

    const b = buildings.find((x) => x.id === selectedBuildingId);
    if (!b) {
      selGroup.visible = false;
      return;
    }

    const def = BUILDING_DEFINITIONS[b.type];
    const size = def?.size[0] || 2;
    const posX = b.x - GRID_SIZE / 2 + size / 2;
    const posZ = b.z - GRID_SIZE / 2 + size / 2;

    selGroup.position.set(posX, 0.05, posZ);
    selGroup.scale.set(size * 0.9, size * 0.9, size * 0.9);
    selGroup.visible = true;
  }, [selectedBuildingId, buildings]);

  // Raycasting for Tile Hover and Click Selection
  const getGridTileFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

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
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (e.buttons === 1 || e.buttons === 2) {
      if (Math.hypot(dx, dy) > 3) {
        isDraggingRef.current = true;
        panCamera(dx, dy);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    }

    const tile = getGridTileFromEvent(e);
    setHoverTile(tile);

    if (hoverIndicatorRef.current && tile) {
      const size =
        placementMode.active && placementMode.buildingType
          ? BUILDING_DEFINITIONS[placementMode.buildingType]?.size[0] || 1
          : 1;

      hoverIndicatorRef.current.position.set(
        tile.x - GRID_SIZE / 2 + size / 2,
        0.05,
        tile.z - GRID_SIZE / 2 + size / 2
      );
      hoverIndicatorRef.current.scale.set(size, size, size);
      hoverIndicatorRef.current.visible = true;

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

    // Check direct building click
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

      if (clickedBuilding.uncollectedResources && clickedBuilding.uncollectedResources > 0) {
        onCollectResource(clickedBuilding.id);
        sounds.playCollect();
      }
    } else {
      onSelectBuilding(null);
    }
  };

  const panCamera = (deltaX: number, deltaY: number) => {
    const factor = zoomLevelRef.current * 0.0017;
    const moveX = (deltaX - deltaY) * factor;
    const moveZ = (-deltaX - deltaY) * factor;

    desiredTargetRef.current.x -= moveX;
    desiredTargetRef.current.z -= moveZ;

    desiredTargetRef.current.x = Math.max(-12, Math.min(12, desiredTargetRef.current.x));
    desiredTargetRef.current.z = Math.max(-12, Math.min(12, desiredTargetRef.current.z));
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.05;
    desiredZoomRef.current = Math.max(20, Math.min(65, desiredZoomRef.current + zoomDelta));
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
            desiredZoomRef.current = Math.max(20, desiredZoomRef.current - 8);
            sounds.playClick();
          }}
          className="w-10 h-10 bg-slate-900/85 hover:bg-slate-800 text-amber-400 font-bold text-xl rounded-xl border border-amber-500/40 shadow-coc flex items-center justify-center transition active:scale-95"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => {
            desiredZoomRef.current = Math.min(65, desiredZoomRef.current + 8);
            sounds.playClick();
          }}
          className="w-10 h-10 bg-slate-900/85 hover:bg-slate-800 text-amber-400 font-bold text-xl rounded-xl border border-amber-500/40 shadow-coc flex items-center justify-center transition active:scale-95"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={() => {
            desiredTargetRef.current.set(0, 0, 0);
            sounds.playClick();
          }}
          className="w-10 h-10 bg-slate-900/85 hover:bg-slate-800 text-amber-400 text-xs rounded-xl border border-amber-500/40 shadow-coc flex items-center justify-center transition active:scale-95"
          title="Recenter Village"
        >
          🎯
        </button>
      </div>
    </div>
  );
}

// ---------------- Helper Three.js Setup ----------------

/**
 * Builds continuous, lush, seamless grass landscape (no checkerboard!),
 * with organic cobblestone pathways, clover patches, wildflowers, and perimeter trees.
 */
function buildLushTerrain(scene: THREE.Scene) {
  const terrainGroup = new THREE.Group();

  // 1. Main Continuous Lush Grass Meadow (Single unbroken green plane)
  const meadowGeo = new THREE.BoxGeometry(GRID_SIZE, 0.4, GRID_SIZE);
  const meadow = new THREE.Mesh(meadowGeo, materials.grassMain);
  meadow.position.y = -0.2;
  meadow.receiveShadow = true;
  terrainGroup.add(meadow);

  // 2. Natural Stone Cliff Dropdown Edge (Beveled bedrock beneath the grass)
  const cliffGeo = new THREE.BoxGeometry(GRID_SIZE + 0.8, 0.6, GRID_SIZE + 0.8);
  const cliff = new THREE.Mesh(cliffGeo, materials.stoneCliff);
  cliff.position.y = -0.6;
  cliff.receiveShadow = true;
  terrainGroup.add(cliff);

  // 3. Surrounding Deep Forest Ground
  const forestFloorGeo = new THREE.BoxGeometry(GRID_SIZE + 18, 0.4, GRID_SIZE + 18);
  const forestFloor = new THREE.Mesh(forestFloorGeo, materials.grassDark);
  forestFloor.position.y = -0.85;
  forestFloor.receiveShadow = true;
  terrainGroup.add(forestFloor);

  // 4. Subtle Organic Dirt Pathways & Stepping Stones
  // Crossroads leading towards the central Citadel of Purpose
  const pathGeoH = new THREE.BoxGeometry(GRID_SIZE - 4, 0.02, 1.4);
  const pathH = new THREE.Mesh(pathGeoH, materials.dirtPath);
  pathH.position.set(0, 0.01, 0);
  pathH.receiveShadow = true;
  terrainGroup.add(pathH);

  const pathGeoV = new THREE.BoxGeometry(1.4, 0.02, GRID_SIZE - 4);
  const pathV = new THREE.Mesh(pathGeoV, materials.dirtPath);
  pathV.position.set(0, 0.01, 0);
  pathV.receiveShadow = true;
  terrainGroup.add(pathV);

  // Cobblestone stepping stones along paths
  const cobbleMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.8,
  });
  const cobbleGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.04, 7);

  for (let i = -7; i <= 7; i += 2) {
    if (Math.abs(i) < 2) continue; // Leave central plaza clear

    const stone1 = new THREE.Mesh(cobbleGeo, cobbleMat);
    stone1.position.set(i, 0.03, (Math.random() - 0.5) * 0.4);
    stone1.rotation.y = Math.random() * Math.PI;
    stone1.receiveShadow = true;
    terrainGroup.add(stone1);

    const stone2 = new THREE.Mesh(cobbleGeo, cobbleMat);
    stone2.position.set((Math.random() - 0.5) * 0.4, 0.03, i);
    stone2.rotation.y = Math.random() * Math.PI;
    stone2.receiveShadow = true;
    terrainGroup.add(stone2);
  }

  // 5. Stylized Flower & Grass Tufts scattered naturally
  const flowerGeo = new THREE.DodecahedronGeometry(0.09);
  const flowerMats = [
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 }), // Yellow buttercup
    new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 }), // Red poppy
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.5 }), // Blue blossom
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), // White daisy
  ];

  const flowerClusterCenters = [
    [-6, -6],
    [6, -6],
    [-6, 6],
    [6, 6],
    [-3, 7],
    [7, -2],
  ];

  flowerClusterCenters.forEach(([cx, cz]) => {
    for (let f = 0; f < 5; f++) {
      const mat = flowerMats[Math.floor(Math.random() * flowerMats.length)];
      const flower = new THREE.Mesh(flowerGeo, mat);
      flower.position.set(
        cx + (Math.random() - 0.5) * 1.8,
        0.05,
        cz + (Math.random() - 0.5) * 1.8
      );
      flower.castShadow = true;
      terrainGroup.add(flower);
    }
  });

  // 6. Perimeter Forest Pines, Oaks & Boulders
  const treeMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
  const treeMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75 });

  const treeGeoCone1 = new THREE.ConeGeometry(0.75, 1.3, 6);
  const treeGeoCone2 = new THREE.ConeGeometry(0.55, 1.0, 6);
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.6, 6);
  const rockGeo = new THREE.DodecahedronGeometry(0.48);

  const placeForestTree = (x: number, z: number, scale: number = 1.0) => {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.3 * scale;
    trunk.scale.set(scale, scale, scale);
    trunk.castShadow = true;
    tree.add(trunk);

    const f1 = new THREE.Mesh(treeGeoCone1, treeMat1);
    f1.position.y = 1.0 * scale;
    f1.scale.set(scale, scale, scale);
    f1.castShadow = true;
    tree.add(f1);

    const f2 = new THREE.Mesh(treeGeoCone2, treeMat2);
    f2.position.y = 1.6 * scale;
    f2.scale.set(scale, scale, scale);
    f2.castShadow = true;
    tree.add(f2);

    tree.position.set(x, 0, z);
    terrainGroup.add(tree);
  };

  const placeForestRock = (x: number, z: number, scale: number = 1.0) => {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(x, 0.22 * scale, z);
    rock.scale.set(scale, scale * 0.8, scale);
    rock.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    rock.castShadow = true;
    rock.receiveShadow = true;
    terrainGroup.add(rock);
  };

  const borderOffset = GRID_SIZE / 2 + 1.8;
  for (let i = -borderOffset; i <= borderOffset; i += 2.0) {
    const s = 0.85 + Math.random() * 0.35;
    placeForestTree(i, -borderOffset, s);
    placeForestTree(i, borderOffset, s);
    placeForestTree(-borderOffset, i, s);
    placeForestTree(borderOffset, i, s);

    if (Math.random() > 0.45) {
      placeForestRock(i + 0.9, -borderOffset - 1.2, 0.7 + Math.random() * 0.4);
      placeForestRock(i - 0.9, borderOffset + 1.2, 0.7 + Math.random() * 0.4);
    }
  }

  scene.add(terrainGroup);
}

/**
 * Creates animated builder hammer swinging on active constructions
 */
function createAnimatedHammer(): THREE.Group {
  const g = new THREE.Group();
  g.name = "builder_hammer";

  // Wooden handle
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.65, 8),
    materials.wood
  );
  handle.position.y = 0.32;
  g.add(handle);

  // Polished steel hammer head
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.16, 0.16),
    materials.iron
  );
  head.position.y = 0.6;
  g.add(head);

  return g;
}

/**
 * Creates floating 3D Gold Coin or Elixir Flask for unharvested mines/collectors
 */
function createResourceFloater(type: "gold" | "elixir"): THREE.Group {
  const g = new THREE.Group();
  g.name = `floater_${type}`;

  if (type === "gold") {
    // 3D Spinning Gold Coin
    const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    coinGeo.rotateX(Math.PI / 2);
    const coin = new THREE.Mesh(coinGeo, materials.goldBright);
    coin.castShadow = true;
    g.add(coin);
  } else {
    // 3D Glowing Elixir Crystal
    const flaskGeo = new THREE.OctahedronGeometry(0.35, 0);
    const flask = new THREE.Mesh(flaskGeo, materials.elixir);
    flask.castShadow = true;
    g.add(flask);
  }

  // Soft glowing beacon ring beneath floater
  const ringGeo = new THREE.RingGeometry(0.4, 0.55, 16);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: type === "gold" ? 0xfacc15 : 0xe879f9,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = -0.4;
  g.add(ring);

  return g;
}

/**
 * Creates a stylish glowing circular selection ring with animated corner brackets
 */
function createSelectionGroup(): THREE.Group {
  const g = new THREE.Group();
  g.name = "selection_group";

  // Glowing base ring
  const ringGeo = new THREE.RingGeometry(1.2, 1.45, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.name = "sel_ring";
  g.add(ring);

  // 4 Corner holographic brackets that rotate
  const bracketsGroup = new THREE.Group();
  bracketsGroup.name = "sel_brackets";

  const bracketMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const b1 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.08), bracketMat);
    b1.rotateX(-Math.PI / 2);
    b1.position.set(Math.cos(angle) * 1.5, 0.01, Math.sin(angle) * 1.5);
    bracketsGroup.add(b1);
  }
  g.add(bracketsGroup);

  return g;
}
