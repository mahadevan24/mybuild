import * as THREE from "three";
import { BuildingType } from "@/types/game";

// Shared materials cache to keep memory low and rendering super performant
const materials = {
  grass1: new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.9 }),
  grass2: new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 }),
  darkStone: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 }),
  roofRed: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 }),
  roofRedDark: new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.6 }),
  gold: new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.8,
    roughness: 0.2,
  }),
  elixir: new THREE.MeshStandardMaterial({
    color: 0xd946ef,
    metalness: 0.3,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85,
  }),
  glass: new THREE.MeshStandardMaterial({
    color: 0xe0e7ff,
    transparent: true,
    opacity: 0.5,
    roughness: 0.1,
  }),
  techBlue: new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.4,
    metalness: 0.6,
  }),
  techGlow: new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
  }),
  iron: new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.8,
    roughness: 0.4,
  }),
  emerald: new THREE.MeshStandardMaterial({
    color: 0x059669,
    roughness: 0.5,
  }),
  cyanZen: new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.4,
  }),
  scaffoldWood: new THREE.MeshStandardMaterial({
    color: 0xa16207,
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

  // If currently upgrading, add scaffolding & hammer
  if (isUpgrading) {
    const scaffold = createScaffolding();
    root.add(scaffold);
  }

  switch (type) {
    case "town_hall":
      root.add(buildTownHall(level));
      break;
    case "gold_mine":
      root.add(buildGoldMine(level));
      break;
    case "elixir_collector":
      root.add(buildElixirCollector(level));
      break;
    case "gold_storage":
      root.add(buildGoldStorage(level));
      break;
    case "elixir_storage":
      root.add(buildElixirStorage(level));
      break;
    case "builder_hut":
      root.add(buildBuilderHut());
      break;
    case "forge_of_code":
      root.add(buildForgeOfCode(level));
      break;
    case "dojo_of_strength":
      root.add(buildDojoOfStrength(level));
      break;
    case "sanctum_of_knowledge":
      root.add(buildSanctumOfKnowledge(level));
      break;
    case "temple_of_mindfulness":
      root.add(buildTempleOfMindfulness(level));
      break;
    case "archer_tower":
      root.add(buildArcherTower(level));
      break;
    default:
      root.add(buildDefaultBox());
  }

  // Cast and receive shadows on all meshes
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

  // Stone Base
  const baseH = 0.5 + level * 0.1;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, baseH, 2.7),
    materials.stone
  );
  base.position.y = baseH / 2;
  g.add(base);

  // Main Hall Walls
  const hallH = 1.2 + level * 0.15;
  const hall = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, hallH, 2.3),
    level >= 3 ? materials.darkStone : materials.wood
  );
  hall.position.y = baseH + hallH / 2;
  g.add(hall);

  // Wooden Double Doors
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.9, 0.1),
    materials.darkWood
  );
  door.position.set(0, baseH + 0.45, 1.16);
  g.add(door);

  // Roof (Pitched pyramidal or stepped)
  const roofH = 0.9 + level * 0.1;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.8 + level * 0.1, roofH, 4),
    materials.roofRed
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = baseH + hallH + roofH / 2;
  g.add(roof);

  // Higher tiers: Chimney, battlements, crest
  if (level >= 2) {
    // Chimney with golden cap
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 1.2, 0.35),
      materials.stone
    );
    chimney.position.set(0.7, baseH + hallH + 0.4, -0.6);
    g.add(chimney);

    const chimneyCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.1, 0.45),
      materials.gold
    );
    chimneyCap.position.set(0.7, baseH + hallH + 1.05, -0.6);
    g.add(chimneyCap);
  }

  if (level >= 3) {
    // Corner Golden Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, hallH + baseH, 8);
    const corners = [
      [-1.25, -1.25],
      [1.25, -1.25],
      [-1.25, 1.25],
      [1.25, 1.25],
    ];
    corners.forEach(([cx, cz]) => {
      const p = new THREE.Mesh(pillarGeo, materials.gold);
      p.position.set(cx, (hallH + baseH) / 2, cz);
      g.add(p);
    });
  }

  if (level >= 4) {
    // Citadel Crest / Spire
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 1.0, 6),
      materials.gold
    );
    spire.position.y = baseH + hallH + roofH + 0.5;
    g.add(spire);

    // Glowing energy orb
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 12),
      materials.techGlow
    );
    orb.position.y = baseH + hallH + roofH + 1.1;
    g.add(orb);
  }

  return g;
}

function buildGoldMine(level: number): THREE.Group {
  const g = new THREE.Group();

  // Stone mine pit ring
  const pit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.95, 0.4, 8),
    materials.stone
  );
  pit.position.y = 0.2;
  g.add(pit);

  // Black mine shaft interior
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 0.45, 8),
    materials.darkStone
  );
  hole.position.y = 0.22;
  g.add(hole);

  // Wooden crane / derrick
  const cranePillar1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 1.4, 6),
    materials.wood
  );
  cranePillar1.position.set(-0.5, 0.7, 0);
  cranePillar1.rotation.z = -0.15;
  g.add(cranePillar1);

  const cranePillar2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 1.4, 6),
    materials.wood
  );
  cranePillar2.position.set(0.5, 0.7, 0);
  cranePillar2.rotation.z = 0.15;
  g.add(cranePillar2);

  const crossBeam = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.1, 0.1),
    materials.wood
  );
  crossBeam.position.set(0, 1.35, 0);
  g.add(crossBeam);

  // Mine cart with glittering gold
  const cart = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.35, 0.45),
    materials.iron
  );
  cart.position.set(0.6, 0.2, 0.5);
  g.add(cart);

  const goldOre = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.22 + level * 0.03),
    materials.gold
  );
  goldOre.position.set(0.6, 0.4, 0.5);
  g.add(goldOre);

  if (level >= 3) {
    // Extra gold nuggets around
    const nug1 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.12),
      materials.gold
    );
    nug1.position.set(-0.6, 0.1, 0.6);
    g.add(nug1);
  }

  return g;
}

function buildElixirCollector(level: number): THREE.Group {
  const g = new THREE.Group();

  // Foundation
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.95, 0.3, 12),
    materials.stone
  );
  base.position.y = 0.15;
  g.add(base);

  // Glass vat
  const vatH = 1.0 + level * 0.1;
  const glassVat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, vatH, 16),
    materials.glass
  );
  glassVat.position.y = 0.3 + vatH / 2;
  g.add(glassVat);

  // Inside Glowing Elixir Fluid
  const fluidH = vatH * 0.75;
  const fluid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, fluidH, 16),
    materials.elixir
  );
  fluid.position.y = 0.3 + fluidH / 2;
  g.add(fluid);

  // Copper top cap & pump
  const topCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 0.2, 12),
    materials.gold
  );
  topCap.position.y = 0.3 + vatH + 0.1;
  g.add(topCap);

  // Pump mechanism
  const pumpPiston = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8),
    materials.iron
  );
  pumpPiston.position.y = 0.3 + vatH + 0.35;
  g.add(pumpPiston);

  return g;
}

function buildGoldStorage(level: number): THREE.Group {
  const g = new THREE.Group();

  // Stone plinth
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.35, 1.8),
    materials.stone
  );
  plinth.position.y = 0.175;
  g.add(plinth);

  // Strongbox Vault
  const vaultH = 0.9 + level * 0.15;
  const vault = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, vaultH, 1.4),
    materials.darkStone
  );
  vault.position.y = 0.35 + vaultH / 2;
  g.add(vault);

  // Iron reinforcement bands
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.15, 1.45),
    materials.iron
  );
  band.position.y = 0.35 + vaultH / 2;
  g.add(band);

  // Circular vault door with golden wheel
  const doorPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16),
    materials.iron
  );
  doorPlate.rotation.x = Math.PI / 2;
  doorPlate.position.set(0, 0.35 + vaultH / 2, 0.75);
  g.add(doorPlate);

  const wheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.04, 8, 16),
    materials.gold
  );
  wheel.position.set(0, 0.35 + vaultH / 2, 0.82);
  g.add(wheel);

  // Gold bars / coins on roof
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.15, 0.25),
    materials.gold
  );
  bar.position.set(0, 0.35 + vaultH + 0.08, 0);
  g.add(bar);

  return g;
}

function buildElixirStorage(level: number): THREE.Group {
  const g = new THREE.Group();

  // Stone plinth
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.0, 0.3, 12),
    materials.stone
  );
  plinth.position.y = 0.15;
  g.add(plinth);

  // Spherical Glass Reservoir
  const sphereR = 0.7 + level * 0.08;
  const glassSphere = new THREE.Mesh(
    new THREE.SphereGeometry(sphereR, 16, 16),
    materials.glass
  );
  glassSphere.position.y = 0.3 + sphereR;
  g.add(glassSphere);

  // Glowing Elixir Inner Core
  const innerSphere = new THREE.Mesh(
    new THREE.SphereGeometry(sphereR * 0.85, 16, 16),
    materials.elixir
  );
  innerSphere.position.y = 0.3 + sphereR;
  g.add(innerSphere);

  // 4 Brass Retaining Claws
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const claw = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, sphereR * 1.5, 0.12),
      materials.gold
    );
    claw.position.set(
      Math.cos(angle) * (sphereR * 0.95),
      0.3 + sphereR,
      Math.sin(angle) * (sphereR * 0.95)
    );
    g.add(claw);
  }

  return g;
}

function buildBuilderHut(): THREE.Group {
  const g = new THREE.Group();

  // Log cabin body
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.8, 1.4),
    materials.wood
  );
  cabin.position.y = 0.4;
  g.add(cabin);

  // Wooden door
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.6, 0.08),
    materials.darkWood
  );
  door.position.set(0, 0.3, 0.72);
  g.add(door);

  // Thatched roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 0.6, 4),
    materials.scaffoldWood
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.8 + 0.3;
  g.add(roof);

  // Workbench outside
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.3, 0.3),
    materials.darkWood
  );
  bench.position.set(0.55, 0.15, 0.9);
  g.add(bench);

  // Anvil on bench
  const anvil = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.15, 0.15),
    materials.iron
  );
  anvil.position.set(0.55, 0.35, 0.9);
  g.add(anvil);

  return g;
}

function buildForgeOfCode(level: number): THREE.Group {
  const g = new THREE.Group();

  // High-tech stone & cyber foundation
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.4, 2.6),
    materials.darkStone
  );
  base.position.y = 0.2;
  g.add(base);

  // Main Terminal Core
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.2, 1.8),
    materials.techBlue
  );
  core.position.y = 0.4 + 0.6;
  g.add(core);

  // Levitating Glowing Code Monolith
  const monolith = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.6 + level * 0.1, 0.6),
    materials.techGlow
  );
  monolith.position.y = 1.0;
  g.add(monolith);

  // Hologram screen displays
  const screen1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.5, 0.05),
    materials.techGlow
  );
  screen1.position.set(0, 1.2, 1.0);
  g.add(screen1);

  // 4 Circuit Pylons
  const corners = [
    [-1.0, -1.0],
    [1.0, -1.0],
    [-1.0, 1.0],
    [1.0, 1.0],
  ];
  corners.forEach(([cx, cz]) => {
    const pylon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 1.2 + level * 0.1, 6),
      materials.iron
    );
    pylon.position.set(cx, 0.4 + 0.6, cz);
    g.add(pylon);

    // Tip laser light
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      materials.techGlow
    );
    tip.position.set(cx, 0.4 + 1.2 + level * 0.1, cz);
    g.add(tip);
  });

  return g;
}

function buildDojoOfStrength(level: number): THREE.Group {
  const g = new THREE.Group();

  // Timber training deck
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.35, 2.6),
    materials.darkWood
  );
  deck.position.y = 0.175;
  g.add(deck);

  // Pagoda pillars
  const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8);
  const posts = [
    [-0.9, -0.9],
    [0.9, -0.9],
    [-0.9, 0.9],
    [0.9, 0.9],
  ];
  posts.forEach(([px, pz]) => {
    const post = new THREE.Mesh(pillarGeo, materials.wood);
    post.position.set(px, 0.35 + 0.7, pz);
    g.add(post);
  });

  // Curved Pagoda Roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.8, 0.8, 4),
    materials.roofRedDark
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.35 + 1.4 + 0.4;
  g.add(roof);

  // Barbells & Training Dummy on deck
  const barbellBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8),
    materials.iron
  );
  barbellBar.rotation.z = Math.PI / 2;
  barbellBar.position.set(0, 0.42, 0.5);
  g.add(barbellBar);

  const plateGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12);
  const plateL = new THREE.Mesh(plateGeo, materials.iron);
  plateL.rotation.z = Math.PI / 2;
  plateL.position.set(-0.5, 0.42, 0.5);
  g.add(plateL);

  const plateR = new THREE.Mesh(plateGeo, materials.iron);
  plateR.rotation.z = Math.PI / 2;
  plateR.position.set(0.5, 0.42, 0.5);
  g.add(plateR);

  // Roaring brazier
  const brazier = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.1, 0.3, 8),
    materials.iron
  );
  brazier.position.set(-0.8, 0.5, 0.8);
  g.add(brazier);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.25, 6),
    new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.8,
    })
  );
  flame.position.set(-0.8, 0.75, 0.8);
  g.add(flame);

  return g;
}

function buildSanctumOfKnowledge(level: number): THREE.Group {
  const g = new THREE.Group();

  // Marble library plinth
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.45, 0.4, 16),
    materials.stone
  );
  plinth.position.y = 0.2;
  g.add(plinth);

  // Circular hall with bookshelf texture feel
  const hall = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.15, 1.2, 16),
    materials.emerald
  );
  hall.position.y = 0.4 + 0.6;
  g.add(hall);

  // Emerald Observatory Dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.emerald
  );
  dome.position.y = 0.4 + 1.2;
  g.add(dome);

  // Brass Astrolabe / Telescope on roof
  const scope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 0.9, 8),
    materials.gold
  );
  scope.rotation.x = -Math.PI / 3;
  scope.rotation.y = Math.PI / 4;
  scope.position.set(0, 0.4 + 1.2 + 0.6, 0);
  g.add(scope);

  // Grand library door
  const archway = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.9, 0.2),
    materials.gold
  );
  archway.position.set(0, 0.4 + 0.45, 1.1);
  g.add(archway);

  return g;
}

function buildTempleOfMindfulness(level: number): THREE.Group {
  const g = new THREE.Group();

  // Polished zen rock garden base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.3, 1.8),
    materials.darkStone
  );
  base.position.y = 0.15;
  g.add(base);

  // Pagoda body
  const pagoda = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.9, 1.2),
    materials.cyanZen
  );
  pagoda.position.y = 0.3 + 0.45;
  g.add(pagoda);

  // Tier 1 Pagoda Eaves
  const eaves1 = new THREE.Mesh(
    new THREE.ConeGeometry(1.4, 0.45, 4),
    materials.darkWood
  );
  eaves1.rotation.y = Math.PI / 4;
  eaves1.position.y = 0.3 + 0.9 + 0.2;
  g.add(eaves1);

  // Tier 2 Spire
  const eaves2 = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 0.4, 4),
    materials.cyanZen
  );
  eaves2.rotation.y = Math.PI / 4;
  eaves2.position.y = 0.3 + 0.9 + 0.55;
  g.add(eaves2);

  // Zen bell hanging inside
  const bell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 0.3, 8),
    materials.gold
  );
  bell.position.set(0, 0.3 + 0.9 + 0.1, 0.65);
  g.add(bell);

  return g;
}

function buildArcherTower(level: number): THREE.Group {
  const g = new THREE.Group();

  // Stone tower base
  const towerH = 1.6 + level * 0.15;
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.75, towerH, 8),
    materials.stone
  );
  tower.position.y = towerH / 2;
  g.add(tower);

  // Wooden platform
  const plat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.2, 8),
    materials.darkWood
  );
  plat.position.y = towerH + 0.1;
  g.add(plat);

  // Battlements fence
  const fence = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.4, 8, 1, true),
    materials.wood
  );
  fence.position.y = towerH + 0.3;
  g.add(fence);

  // Lookout canopy
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(1.0, 0.5, 8),
    materials.roofRed
  );
  canopy.position.y = towerH + 1.2;
  g.add(canopy);

  // Canopy posts
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.9, 4),
      materials.wood
    );
    post.position.set(
      Math.cos(angle) * 0.7,
      towerH + 0.65,
      Math.sin(angle) * 0.7
    );
    g.add(post);
  }

  return g;
}

function createScaffolding(): THREE.Group {
  const g = new THREE.Group();
  g.name = "scaffolding";

  // 4 corner wooden poles
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6);
  const corners = [
    [-1.2, -1.2],
    [1.2, -1.2],
    [-1.2, 1.2],
    [1.2, 1.2],
  ];

  corners.forEach(([cx, cz]) => {
    const p = new THREE.Mesh(poleGeo, materials.scaffoldWood);
    p.position.set(cx, 1.3, cz);
    g.add(p);
  });

  // Cross horizontal planks
  const plankHGeo = new THREE.BoxGeometry(2.4, 0.08, 0.08);
  const plankVGeo = new THREE.BoxGeometry(0.08, 0.08, 2.4);

  [0.8, 1.6, 2.2].forEach((y) => {
    const b1 = new THREE.Mesh(plankHGeo, materials.scaffoldWood);
    b1.position.set(0, y, 1.2);
    g.add(b1);

    const b2 = new THREE.Mesh(plankHGeo, materials.scaffoldWood);
    b2.position.set(0, y, -1.2);
    g.add(b2);

    const b3 = new THREE.Mesh(plankVGeo, materials.scaffoldWood);
    b3.position.set(1.2, y, 0);
    g.add(b3);

    const b4 = new THREE.Mesh(plankVGeo, materials.scaffoldWood);
    b4.position.set(-1.2, y, 0);
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
