import * as THREE from "three";
import { BuildingType } from "@/types/game";

// High-fidelity PBR materials cache with ACESFilmic-tuned colors
export const materials = {
  // Terrain & Paths
  grassMain: new THREE.MeshStandardMaterial({
    color: 0x3ea843,
    roughness: 0.85,
    metalness: 0.05,
  }),
  grassDark: new THREE.MeshStandardMaterial({
    color: 0x2e8b34,
    roughness: 0.9,
  }),
  dirtPath: new THREE.MeshStandardMaterial({
    color: 0x8a6240,
    roughness: 0.95,
  }),
  stoneCliff: new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.8,
  }),
  waterEdge: new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.2,
    metalness: 0.3,
    transparent: true,
    opacity: 0.8,
  }),

  // Architecture Materials
  stone: new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.7,
  }),
  darkStone: new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.75,
  }),
  smoothMarble: new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.4,
  }),
  wood: new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.65,
  }),
  darkWood: new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.7,
  }),
  plankWood: new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.7,
  }),
  roofRed: new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.45,
  }),
  roofRedDark: new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.5,
  }),
  gold: new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.85,
    roughness: 0.2,
  }),
  goldBright: new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xca8a04,
    emissiveIntensity: 0.35,
    metalness: 0.9,
    roughness: 0.15,
  }),
  elixir: new THREE.MeshStandardMaterial({
    color: 0xe879f9,
    emissive: 0xa21caf,
    emissiveIntensity: 0.45,
    metalness: 0.2,
    roughness: 0.15,
    transparent: true,
    opacity: 0.88,
  }),
  glass: new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    metalness: 0.1,
  }),
  techBlue: new THREE.MeshStandardMaterial({
    color: 0x0369a1,
    roughness: 0.35,
    metalness: 0.6,
  }),
  techGlow: new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.85,
  }),
  iron: new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.35,
  }),
  emerald: new THREE.MeshStandardMaterial({
    color: 0x059669,
    emissive: 0x047857,
    emissiveIntensity: 0.25,
    roughness: 0.4,
  }),
  cyanZen: new THREE.MeshStandardMaterial({
    color: 0x0891b2,
    roughness: 0.4,
  }),
  flame: new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 1.0,
    roughness: 0.3,
  }),
  scaffoldWood: new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.9,
  }),
};

/**
 * Creates 3D procedural low-poly model for any building type and level
 */
export function createBuildingModel(
  type: BuildingType,
  level: number,
  isUpgrading: boolean = false
): THREE.Group {
  const root = new THREE.Group();
  root.name = `building_${type}_lvl${level}`;

  // If currently upgrading, add scaffolding & animated hammer
  if (isUpgrading) {
    const scaffold = createScaffolding();
    root.add(scaffold);
  }

  let model: THREE.Group;
  switch (type) {
    case "town_hall":
      model = buildTownHall(level);
      break;
    case "gold_mine":
      model = buildGoldMine(level);
      break;
    case "elixir_collector":
      model = buildElixirCollector(level);
      break;
    case "gold_storage":
      model = buildGoldStorage(level);
      break;
    case "elixir_storage":
      model = buildElixirStorage(level);
      break;
    case "builder_hut":
      model = buildBuilderHut();
      break;
    case "forge_of_code":
      model = buildForgeOfCode(level);
      break;
    case "dojo_of_strength":
      model = buildDojoOfStrength(level);
      break;
    case "sanctum_of_knowledge":
      model = buildSanctumOfKnowledge(level);
      break;
    case "temple_of_mindfulness":
      model = buildTempleOfMindfulness(level);
      break;
    case "archer_tower":
      model = buildArcherTower(level);
      break;
    default:
      model = buildDefaultBox();
  }
  root.add(model);

  // Cast and receive shadows on all sub-meshes
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return root;
}

// ----------------- Procedural Building Builders -----------------

function buildTownHall(level: number): THREE.Group {
  const g = new THREE.Group();

  // Stone Plinth / Bastion Base
  const baseH = 0.55 + level * 0.1;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, baseH, 2.8),
    materials.darkStone
  );
  base.position.y = baseH / 2;
  g.add(base);

  // Main Hall Walls (reinforced masonry)
  const hallH = 1.3 + level * 0.15;
  const hall = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, hallH, 2.35),
    level >= 3 ? materials.stone : materials.wood
  );
  hall.position.y = baseH + hallH / 2;
  g.add(hall);

  // Wooden Double Doors with Gold Trim
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 1.0, 0.12),
    materials.darkStone
  );
  doorFrame.position.set(0, baseH + 0.5, 1.18);
  g.add(doorFrame);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.9, 0.14),
    materials.darkWood
  );
  door.position.set(0, baseH + 0.45, 1.2);
  g.add(door);

  const doorHandle = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    materials.gold
  );
  doorHandle.position.set(0.18, baseH + 0.45, 1.28);
  g.add(doorHandle);

  // Main Stepped Pitched Roof (Clash of Clans trademark red roof)
  const roofH = 1.0 + level * 0.1;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.0 + level * 0.1, roofH, 4),
    materials.roofRed
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = baseH + hallH + roofH / 2;
  g.add(roof);

  // Golden Ridge Rim
  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    materials.gold
  );
  ridge.position.y = baseH + hallH + roofH + 0.05;
  g.add(ridge);

  // Level Details: Chimney, banners, battlements, beacon
  if (level >= 2) {
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 1.3, 0.38),
      materials.stone
    );
    chimney.position.set(0.75, baseH + hallH + 0.4, -0.65);
    g.add(chimney);

    const chimneyCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.12, 0.48),
      materials.gold
    );
    chimneyCap.position.set(0.75, baseH + hallH + 1.1, -0.65);
    g.add(chimneyCap);

    // Front Banners
    const bannerMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.6,
    });
    const bannerL = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.7, 0.04),
      bannerMat
    );
    bannerL.position.set(-0.7, baseH + 0.8, 1.2);
    g.add(bannerL);

    const bannerR = bannerL.clone();
    bannerR.position.set(0.7, baseH + 0.8, 1.2);
    g.add(bannerR);
  }

  if (level >= 3) {
    // 4 Golden Corner Buttress Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.14, 0.16, hallH + baseH, 8);
    const corners = [
      [-1.3, -1.3],
      [1.3, -1.3],
      [-1.3, 1.3],
      [1.3, 1.3],
    ];
    corners.forEach(([cx, cz]) => {
      const p = new THREE.Mesh(pillarGeo, materials.gold);
      p.position.set(cx, (hallH + baseH) / 2, cz);
      g.add(p);
    });
  }

  if (level >= 4) {
    // Top Spire with animated beacon
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 1.1, 6),
      materials.goldBright
    );
    spire.position.y = baseH + hallH + roofH + 0.55;
    g.add(spire);

    // Animated Floating Beacon Orb
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      materials.techGlow
    );
    orb.position.y = baseH + hallH + roofH + 1.2;
    orb.userData = { animType: "floatPulse", basePosY: baseH + hallH + roofH + 1.2 };
    g.add(orb);
  }

  return g;
}

function buildGoldMine(level: number): THREE.Group {
  const g = new THREE.Group();

  // Stone mine pit with beveled rim
  const pit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.0, 0.45, 12),
    materials.darkStone
  );
  pit.position.y = 0.22;
  g.add(pit);

  // Mine shaft deep dark opening
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 0.5, 12),
    new THREE.MeshBasicMaterial({ color: 0x09090b })
  );
  shaft.position.y = 0.25;
  g.add(shaft);

  // Heavy Timber Crane / A-Frame Derrick
  const derrick = new THREE.Group();
  derrick.name = "crane_derrick";

  const beamGeo = new THREE.CylinderGeometry(0.07, 0.09, 1.5, 6);
  const leftLeg = new THREE.Mesh(beamGeo, materials.wood);
  leftLeg.position.set(-0.55, 0.75, 0);
  leftLeg.rotation.z = -0.2;
  derrick.add(leftLeg);

  const rightLeg = new THREE.Mesh(beamGeo, materials.wood);
  rightLeg.position.set(0.55, 0.75, 0);
  rightLeg.rotation.z = 0.2;
  derrick.add(rightLeg);

  const topBeam = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.12, 0.12),
    materials.wood
  );
  topBeam.position.set(0, 1.45, 0);
  derrick.add(topBeam);

  // Animated rotating wheel/pulley
  const pulley = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.08, 12),
    materials.iron
  );
  pulley.rotation.z = Math.PI / 2;
  pulley.position.set(0, 1.35, 0);
  pulley.userData = { animType: "rotateZ", speed: 2.5 };
  derrick.add(pulley);

  g.add(derrick);

  // Mine cart on wooden tracks
  const cartGroup = new THREE.Group();
  cartGroup.position.set(0.65, 0.22, 0.55);

  const cart = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.38, 0.5),
    materials.iron
  );
  cartGroup.add(cart);

  // Glowing gold ore mound
  const goldOre = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.26 + level * 0.03),
    materials.goldBright
  );
  goldOre.position.y = 0.22;
  cartGroup.add(goldOre);

  g.add(cartGroup);

  return g;
}

function buildElixirCollector(level: number): THREE.Group {
  const g = new THREE.Group();

  // Foundation Ring
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.05, 0.32, 16),
    materials.darkStone
  );
  base.position.y = 0.16;
  g.add(base);

  // Glass Vat with refraction
  const vatH = 1.1 + level * 0.1;
  const glassVat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, vatH, 20),
    materials.glass
  );
  glassVat.position.y = 0.32 + vatH / 2;
  g.add(glassVat);

  // Animated Glowing Elixir Fluid (bobs & pulses)
  const fluidH = vatH * 0.78;
  const fluid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, fluidH, 20),
    materials.elixir
  );
  fluid.position.y = 0.32 + fluidH / 2;
  fluid.userData = {
    animType: "fluidPulse",
    basePosY: 0.32 + fluidH / 2,
    baseScaleY: 1.0,
  };
  g.add(fluid);

  // Polished Copper/Brass Top Cap
  const topCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 0.22, 16),
    materials.gold
  );
  topCap.position.y = 0.32 + vatH + 0.11;
  g.add(topCap);

  // Animated Hydraulic Pumping Piston
  const piston = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.5, 12),
    materials.iron
  );
  piston.position.y = 0.32 + vatH + 0.38;
  piston.userData = {
    animType: "pistonBob",
    basePosY: 0.32 + vatH + 0.38,
    stroke: 0.18,
  };
  g.add(piston);

  return g;
}

function buildGoldStorage(level: number): THREE.Group {
  const g = new THREE.Group();

  // Granite Foundation
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.35, 1.9),
    materials.darkStone
  );
  plinth.position.y = 0.175;
  g.add(plinth);

  // Fortified Vault Cube
  const vaultH = 1.0 + level * 0.15;
  const vault = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, vaultH, 1.5),
    materials.stone
  );
  vault.position.y = 0.35 + vaultH / 2;
  g.add(vault);

  // Heavy Iron Bands
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.16, 1.55),
    materials.iron
  );
  band.position.y = 0.35 + vaultH / 2;
  g.add(band);

  // Circular Vault Door with Golden Wheel
  const doorPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.12, 20),
    materials.iron
  );
  doorPlate.rotation.x = Math.PI / 2;
  doorPlate.position.set(0, 0.35 + vaultH / 2, 0.8);
  g.add(doorPlate);

  const wheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.045, 12, 20),
    materials.goldBright
  );
  wheel.position.set(0, 0.35 + vaultH / 2, 0.88);
  g.add(wheel);

  // Stacks of Gold Ingots on top
  const barGeo = new THREE.BoxGeometry(0.35, 0.14, 0.2);
  const bar1 = new THREE.Mesh(barGeo, materials.goldBright);
  bar1.position.set(-0.2, 0.35 + vaultH + 0.07, 0);
  g.add(bar1);

  const bar2 = new THREE.Mesh(barGeo, materials.goldBright);
  bar2.position.set(0.2, 0.35 + vaultH + 0.07, 0);
  g.add(bar2);

  const bar3 = new THREE.Mesh(barGeo, materials.goldBright);
  bar3.position.set(0, 0.35 + vaultH + 0.21, 0);
  bar3.rotation.y = Math.PI / 2;
  g.add(bar3);

  return g;
}

function buildElixirStorage(level: number): THREE.Group {
  const g = new THREE.Group();

  // Stone Pedestal
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.1, 0.35, 16),
    materials.darkStone
  );
  plinth.position.y = 0.175;
  g.add(plinth);

  // Spherical Glass Reservoir
  const sphereR = 0.75 + level * 0.08;
  const glassSphere = new THREE.Mesh(
    new THREE.SphereGeometry(sphereR, 24, 24),
    materials.glass
  );
  glassSphere.position.y = 0.35 + sphereR;
  g.add(glassSphere);

  // Animated Glowing Inner Elixir Core
  const innerSphere = new THREE.Mesh(
    new THREE.SphereGeometry(sphereR * 0.88, 20, 20),
    materials.elixir
  );
  innerSphere.position.y = 0.35 + sphereR;
  innerSphere.userData = {
    animType: "floatPulse",
    basePosY: 0.35 + sphereR,
  };
  g.add(innerSphere);

  // Brass Retaining Claws
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const claw = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, sphereR * 1.5, 0.14),
      materials.gold
    );
    claw.position.set(
      Math.cos(angle) * (sphereR * 0.96),
      0.35 + sphereR,
      Math.sin(angle) * (sphereR * 0.96)
    );
    g.add(claw);
  }

  return g;
}

function buildBuilderHut(): THREE.Group {
  const g = new THREE.Group();

  // Cozy Log Cabin Body
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.85, 1.45),
    materials.wood
  );
  cabin.position.y = 0.425;
  g.add(cabin);

  // Door
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.65, 0.08),
    materials.darkWood
  );
  door.position.set(0, 0.325, 0.75);
  g.add(door);

  // Thatched Roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.25, 0.65, 4),
    materials.scaffoldWood
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.85 + 0.325;
  g.add(roof);

  // Workbench outside with miniature hammer & anvil
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.3, 0.35),
    materials.darkWood
  );
  bench.position.set(0.6, 0.15, 0.95);
  g.add(bench);

  const anvil = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.16, 0.18),
    materials.iron
  );
  anvil.position.set(0.6, 0.36, 0.95);
  g.add(anvil);

  return g;
}

function buildForgeOfCode(level: number): THREE.Group {
  const g = new THREE.Group();

  // High-Tech Cyber Bastion Foundation
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.42, 2.7),
    materials.darkStone
  );
  base.position.y = 0.21;
  g.add(base);

  // Terminal Housing Core
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 1.25, 1.9),
    materials.techBlue
  );
  core.position.y = 0.42 + 0.625;
  g.add(core);

  // Animated Floating Cyber Monolith (hover and gentle spin)
  const monolith = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 1.7 + level * 0.12, 0.65),
    materials.techGlow
  );
  monolith.position.y = 1.05;
  monolith.userData = { animType: "levitateSpin", basePosY: 1.05, speed: 1.2 };
  g.add(monolith);

  // Holographic Screen
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.55, 0.05),
    materials.techGlow
  );
  screen.position.set(0, 1.3, 1.05);
  g.add(screen);

  // 4 Glowing Quantum Energy Pylons
  const corners = [
    [-1.05, -1.05],
    [1.05, -1.05],
    [-1.05, 1.05],
    [1.05, 1.05],
  ];
  corners.forEach(([cx, cz]) => {
    const pylon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 1.3 + level * 0.1, 8),
      materials.iron
    );
    pylon.position.set(cx, 0.42 + 0.65, cz);
    g.add(pylon);

    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      materials.techGlow
    );
    tip.position.set(cx, 0.42 + 1.3 + level * 0.1, cz);
    tip.userData = { animType: "floatPulse", basePosY: 0.42 + 1.3 + level * 0.1 };
    g.add(tip);
  });

  return g;
}

function buildDojoOfStrength(level: number): THREE.Group {
  const g = new THREE.Group();

  // Timber Training Deck
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.38, 2.7),
    materials.darkWood
  );
  deck.position.y = 0.19;
  g.add(deck);

  // Red/Dark Pagoda Pillars
  const pillarGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.5, 8);
  const posts = [
    [-0.95, -0.95],
    [0.95, -0.95],
    [-0.95, 0.95],
    [0.95, 0.95],
  ];
  posts.forEach(([px, pz]) => {
    const post = new THREE.Mesh(pillarGeo, materials.darkWood);
    post.position.set(px, 0.38 + 0.75, pz);
    g.add(post);
  });

  // Curved Pagoda Roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.9, 0.85, 4),
    materials.roofRedDark
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.38 + 1.5 + 0.42;
  g.add(roof);

  // Training Dummy on Deck
  const dummyGroup = new THREE.Group();
  dummyGroup.position.set(0, 0.38, 0);
  dummyGroup.userData = { animType: "punchDummySway" };

  const dummyPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8),
    materials.wood
  );
  dummyPost.position.y = 0.45;
  dummyGroup.add(dummyPost);

  const dummyArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6),
    materials.wood
  );
  dummyArm.rotation.z = Math.PI / 2;
  dummyArm.position.y = 0.65;
  dummyGroup.add(dummyArm);

  g.add(dummyGroup);

  // Flaming Brazier with Animated Fire
  const brazier = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.12, 0.35, 12),
    materials.iron
  );
  brazier.position.set(-0.85, 0.55, 0.85);
  g.add(brazier);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.32, 8),
    materials.flame
  );
  flame.position.set(-0.85, 0.85, 0.85);
  flame.userData = { animType: "flameFlicker", basePosY: 0.85 };
  g.add(flame);

  return g;
}

function buildSanctumOfKnowledge(level: number): THREE.Group {
  const g = new THREE.Group();

  // Marble Observatory Base
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.5, 0.42, 20),
    materials.smoothMarble
  );
  plinth.position.y = 0.21;
  g.add(plinth);

  // Grand Hall
  const hall = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 1.25, 20),
    materials.emerald
  );
  hall.position.y = 0.42 + 0.625;
  g.add(hall);

  // Emerald Observatory Dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.emerald
  );
  dome.position.y = 0.42 + 1.25;
  g.add(dome);

  // Brass Astrolabe / Telescope on roof (animated sway)
  const scope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.13, 0.95, 12),
    materials.goldBright
  );
  scope.rotation.x = -Math.PI / 3;
  scope.rotation.y = Math.PI / 4;
  scope.position.set(0, 0.42 + 1.25 + 0.65, 0);
  scope.userData = { animType: "astrolabeOrbit" };
  g.add(scope);

  return g;
}

function buildTempleOfMindfulness(level: number): THREE.Group {
  const g = new THREE.Group();

  // Zen Sand & Slate Foundation
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.32, 1.9),
    materials.darkStone
  );
  base.position.y = 0.16;
  g.add(base);

  // Pagoda Center
  const pagoda = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.95, 1.25),
    materials.cyanZen
  );
  pagoda.position.y = 0.32 + 0.475;
  g.add(pagoda);

  // Tier 1 Eaves
  const eaves1 = new THREE.Mesh(
    new THREE.ConeGeometry(1.5, 0.48, 4),
    materials.darkWood
  );
  eaves1.rotation.y = Math.PI / 4;
  eaves1.position.y = 0.32 + 0.95 + 0.22;
  g.add(eaves1);

  // Tier 2 Eaves
  const eaves2 = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 0.42, 4),
    materials.cyanZen
  );
  eaves2.rotation.y = Math.PI / 4;
  eaves2.position.y = 0.32 + 0.95 + 0.58;
  g.add(eaves2);

  // Hanging Zen Bell (animated sway)
  const bell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 0.32, 12),
    materials.goldBright
  );
  bell.position.set(0, 0.32 + 0.95 + 0.1, 0.7);
  bell.userData = { animType: "bellSway" };
  g.add(bell);

  return g;
}

function buildArcherTower(level: number): THREE.Group {
  const g = new THREE.Group();

  // Stone Tower
  const towerH = 1.7 + level * 0.15;
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.8, towerH, 12),
    materials.stone
  );
  tower.position.y = towerH / 2;
  g.add(tower);

  // Wooden Platform
  const plat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 0.22, 12),
    materials.darkWood
  );
  plat.position.y = towerH + 0.11;
  g.add(plat);

  // Fence Battlements
  const fence = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.42, 12, 1, true),
    materials.wood
  );
  fence.position.y = towerH + 0.32;
  g.add(fence);

  // Canopy Roof
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(1.05, 0.55, 8),
    materials.roofRed
  );
  canopy.position.y = towerH + 1.25;
  g.add(canopy);

  return g;
}

function createScaffolding(): THREE.Group {
  const g = new THREE.Group();
  g.name = "scaffolding";

  // 4 Corner Timber Poles
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 6);
  const corners = [
    [-1.25, -1.25],
    [1.25, -1.25],
    [-1.25, 1.25],
    [1.25, 1.25],
  ];

  corners.forEach(([cx, cz]) => {
    const p = new THREE.Mesh(poleGeo, materials.scaffoldWood);
    p.position.set(cx, 1.4, cz);
    g.add(p);
  });

  // Cross horizontal planks
  const plankHGeo = new THREE.BoxGeometry(2.5, 0.08, 0.08);
  const plankVGeo = new THREE.BoxGeometry(0.08, 0.08, 2.5);

  [0.85, 1.7, 2.4].forEach((y) => {
    const b1 = new THREE.Mesh(plankHGeo, materials.scaffoldWood);
    b1.position.set(0, y, 1.25);
    g.add(b1);

    const b2 = new THREE.Mesh(plankHGeo, materials.scaffoldWood);
    b2.position.set(0, y, -1.25);
    g.add(b2);

    const b3 = new THREE.Mesh(plankVGeo, materials.scaffoldWood);
    b3.position.set(1.25, y, 0);
    g.add(b3);

    const b4 = new THREE.Mesh(plankVGeo, materials.scaffoldWood);
    b4.position.set(-1.25, y, 0);
    g.add(b4);
  });

  return g;
}

function buildDefaultBox(): THREE.Group {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), materials.stone);
  box.position.y = 0.75;
  g.add(box);
  return g;
}
