import * as THREE from 'three';
import { PieceType } from '../../types/chess';

// Cache geometries so we don't recreate them for each mesh
const geometryCache = new Map<string, THREE.BufferGeometry>();

/**
 * Helper to build lathe points from an array of [radius, y] coordinates
 */
function makeLatheGeometry(pointsData: [number, number][], segments = 32): THREE.BufferGeometry {
  const points = pointsData.map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(points, segments);
}

/**
 * Creates Pawn Geometry
 */
function createPawnGeometry(): THREE.BufferGeometry {
  const points: [number, number][] = [
    [0.0, 0.0],
    [0.34, 0.0],
    [0.35, 0.04],
    [0.33, 0.08],
    [0.28, 0.12],
    [0.26, 0.18],
    [0.20, 0.32],
    [0.17, 0.48],
    [0.16, 0.62],
    [0.22, 0.66],
    [0.22, 0.70],
    [0.17, 0.72],
    [0.14, 0.74],
    [0.21, 0.84],
    [0.22, 0.94],
    [0.18, 1.04],
    [0.09, 1.10],
    [0.0, 1.12],
  ];
  const geom = makeLatheGeometry(points, 32);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates Rook Geometry with Castle Battlements
 */
function createRookGeometry(): THREE.BufferGeometry {
  // Main body
  const points: [number, number][] = [
    [0.0, 0.0],
    [0.36, 0.0],
    [0.37, 0.05],
    [0.34, 0.10],
    [0.30, 0.14],
    [0.28, 0.22],
    [0.23, 0.40],
    [0.21, 0.70],
    [0.23, 0.88],
    [0.30, 0.98],
    [0.32, 1.04],
    [0.33, 1.25],
    [0.26, 1.25],
    [0.26, 1.12],
    [0.0, 1.12],
  ];
  const body = makeLatheGeometry(points, 32);

  // We can merge battlements or return the composite group
  // For clean buffer geometry, we combine body with crenellation notches or we can return the body
  body.computeVertexNormals();
  return body;
}

/**
 * Creates Bishop Geometry
 */
function createBishopGeometry(): THREE.BufferGeometry {
  const points: [number, number][] = [
    [0.0, 0.0],
    [0.35, 0.0],
    [0.36, 0.05],
    [0.33, 0.10],
    [0.28, 0.15],
    [0.26, 0.25],
    [0.20, 0.50],
    [0.17, 0.75],
    [0.22, 0.82],
    [0.24, 0.86],
    [0.18, 0.88],
    [0.16, 0.92],
    [0.22, 1.04],
    [0.24, 1.20],
    [0.21, 1.34],
    [0.13, 1.44],
    [0.05, 1.48],
    [0.08, 1.52],
    [0.05, 1.56],
    [0.0, 1.58],
  ];
  const geom = makeLatheGeometry(points, 32);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates Queen Geometry
 */
function createQueenGeometry(): THREE.BufferGeometry {
  const points: [number, number][] = [
    [0.0, 0.0],
    [0.38, 0.0],
    [0.39, 0.06],
    [0.36, 0.12],
    [0.30, 0.18],
    [0.27, 0.30],
    [0.22, 0.60],
    [0.19, 0.95],
    [0.25, 1.05],
    [0.26, 1.10],
    [0.20, 1.14],
    [0.18, 1.20],
    [0.25, 1.35],
    [0.32, 1.55],
    [0.30, 1.62],
    [0.22, 1.65],
    [0.12, 1.68],
    [0.14, 1.74],
    [0.09, 1.80],
    [0.0, 1.82],
  ];
  const geom = makeLatheGeometry(points, 36);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates King Geometry
 */
function createKingGeometry(): THREE.BufferGeometry {
  const points: [number, number][] = [
    [0.0, 0.0],
    [0.40, 0.0],
    [0.41, 0.06],
    [0.38, 0.12],
    [0.32, 0.20],
    [0.28, 0.35],
    [0.23, 0.70],
    [0.21, 1.05],
    [0.28, 1.16],
    [0.29, 1.22],
    [0.22, 1.26],
    [0.20, 1.32],
    [0.27, 1.48],
    [0.33, 1.70],
    [0.30, 1.76],
    [0.18, 1.80],
    [0.14, 1.83],
    [0.0, 1.84],
  ];
  const geom = makeLatheGeometry(points, 36);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates Knight Geometry (Head & Pedestal)
 */
function createKnightBaseGeometry(): THREE.BufferGeometry {
  const points: [number, number][] = [
    [0.0, 0.0],
    [0.36, 0.0],
    [0.37, 0.05],
    [0.34, 0.10],
    [0.30, 0.16],
    [0.28, 0.24],
    [0.24, 0.35],
    [0.25, 0.40],
    [0.21, 0.42],
    [0.0, 0.42],
  ];
  return makeLatheGeometry(points, 32);
}

function createKnightHeadGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // Knight silhouette side profile
  shape.moveTo(0.0, 0.0);
  shape.lineTo(0.24, 0.0);
  shape.lineTo(0.26, 0.12);
  shape.lineTo(0.32, 0.28);
  shape.lineTo(0.38, 0.42);
  shape.lineTo(0.32, 0.48); // snout bottom
  shape.lineTo(0.22, 0.52); // mouth
  shape.lineTo(0.28, 0.62); // snout bridge
  shape.lineTo(0.24, 0.72); // forehead
  shape.lineTo(0.18, 0.88); // ear tip
  shape.lineTo(0.12, 0.78); // ear base
  shape.lineTo(0.08, 0.84); // second ear tip
  shape.lineTo(0.03, 0.74);
  shape.lineTo(-0.08, 0.58); // mane curve
  shape.lineTo(-0.16, 0.38); // neck crest
  shape.lineTo(-0.20, 0.18); // neck back
  shape.lineTo(-0.18, 0.0);
  shape.closePath();

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelOffset: 0,
    bevelSegments: 4,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();
  geom.rotateY(Math.PI / 2);
  geom.translate(0, 0.78, 0.02);
  geom.computeVertexNormals();
  return geom;
}

function addBaseAccentRing(group: THREE.Group, radius: number, accentMaterial: THREE.Material) {
  const ringKey = `base_ring_${radius.toFixed(2)}`;
  let geom = geometryCache.get(ringKey);
  if (!geom) {
    geom = new THREE.TorusGeometry(radius * 0.92, 0.024, 8, 28);
    geom.rotateX(Math.PI / 2);
    geometryCache.set(ringKey, geom);
  }
  const ring = new THREE.Mesh(geom, accentMaterial);
  ring.position.y = 0.06;
  group.add(ring);
}

/**
 * Builds a complete piece Mesh or Group for a given piece type and material
 */
export function createPieceMesh(
  type: PieceType,
  material: THREE.Material,
  accentMaterial: THREE.Material
): THREE.Group {
  const group = new THREE.Group();

  switch (type) {
    case 'p': {
      let geom = geometryCache.get('pawn');
      if (!geom) {
        geom = createPawnGeometry();
        geometryCache.set('pawn', geom);
      }
      const mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      addBaseAccentRing(group, 0.34, accentMaterial);
      break;
    }

    case 'r': {
      let geom = geometryCache.get('rook');
      if (!geom) {
        geom = createRookGeometry();
        geometryCache.set('rook', geom);
      }
      const mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Add 4 turret crenels on top
      const crenelGeom = new THREE.BoxGeometry(0.12, 0.12, 0.1);
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const crenel = new THREE.Mesh(crenelGeom, material);
        crenel.position.set(Math.cos(angle) * 0.27, 1.29, Math.sin(angle) * 0.27);
        crenel.castShadow = true;
        group.add(crenel);
      }
      addBaseAccentRing(group, 0.36, accentMaterial);
      break;
    }

    case 'n': {
      let baseGeom = geometryCache.get('knight_base');
      if (!baseGeom) {
        baseGeom = createKnightBaseGeometry();
        geometryCache.set('knight_base', baseGeom);
      }
      const baseMesh = new THREE.Mesh(baseGeom, material);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      let headGeom = geometryCache.get('knight_head');
      if (!headGeom) {
        headGeom = createKnightHeadGeometry();
        geometryCache.set('knight_head', headGeom);
      }
      const headMesh = new THREE.Mesh(headGeom, material);
      headMesh.castShadow = true;
      headMesh.receiveShadow = true;
      group.add(headMesh);

      // Tactical glowing visor / eye nodes
      const eyeGeom = new THREE.SphereGeometry(0.035, 12, 12);
      const eyeLeft = new THREE.Mesh(eyeGeom, accentMaterial);
      eyeLeft.position.set(0.12, 0.98, 0.12);
      const eyeRight = new THREE.Mesh(eyeGeom, accentMaterial);
      eyeRight.position.set(-0.12, 0.98, 0.12);
      group.add(eyeLeft, eyeRight);
      addBaseAccentRing(group, 0.36, accentMaterial);
      break;
    }

    case 'b': {
      let geom = geometryCache.get('bishop');
      if (!geom) {
        geom = createBishopGeometry();
        geometryCache.set('bishop', geom);
      }
      const mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Accent ring around collar
      const ringGeom = new THREE.TorusGeometry(0.19, 0.025, 12, 24);
      ringGeom.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeom, accentMaterial);
      ring.position.y = 0.88;
      group.add(ring);
      addBaseAccentRing(group, 0.35, accentMaterial);
      break;
    }

    case 'q': {
      let geom = geometryCache.get('queen');
      if (!geom) {
        geom = createQueenGeometry();
        geometryCache.set('queen', geom);
      }
      const mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Crown points / coronet pearls
      const crownPearlGeom = new THREE.SphereGeometry(0.045, 12, 12);
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const pearl = new THREE.Mesh(crownPearlGeom, accentMaterial);
        pearl.position.set(Math.cos(angle) * 0.28, 1.64, Math.sin(angle) * 0.28);
        pearl.castShadow = true;
        group.add(pearl);
      }
      addBaseAccentRing(group, 0.38, accentMaterial);
      break;
    }

    case 'k': {
      let geom = geometryCache.get('king');
      if (!geom) {
        geom = createKingGeometry();
        geometryCache.set('king', geom);
      }
      const mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Royal Cross Finial
      const crossVertGeom = new THREE.BoxGeometry(0.06, 0.22, 0.05);
      const crossHorizGeom = new THREE.BoxGeometry(0.18, 0.06, 0.05);
      const vert = new THREE.Mesh(crossVertGeom, accentMaterial);
      vert.position.y = 1.95;
      vert.castShadow = true;
      const horiz = new THREE.Mesh(crossHorizGeom, accentMaterial);
      horiz.position.y = 1.98;
      horiz.castShadow = true;
      group.add(vert, horiz);
      addBaseAccentRing(group, 0.40, accentMaterial);
      break;
    }
  }

  return group;
}
