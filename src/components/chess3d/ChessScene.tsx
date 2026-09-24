import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Chess } from 'chess.js';
import { CameraView, GameSettings, PieceColor, PieceType } from '../../types/chess';
import { createPieceMesh } from './pieceGeometries';

interface ChessSceneProps {
  chess: Chess;
  fen: string;
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  cameraView: CameraView;
  settings: GameSettings;
  onSquareClick: (square: string) => void;
  orientation?: PieceColor;
}

interface AnimatedPiece {
  id: string;
  group: THREE.Group;
  startX: number;
  startZ: number;
  targetX: number;
  targetZ: number;
  startY: number;
  targetY: number;
  progress: number;
  duration: number; // in seconds
}

interface CapturedPieceAnim {
  group: THREE.Group;
  startTime: number;
  duration: number; // in seconds
  startY: number;
}

export const ChessScene: React.FC<ChessSceneProps> = ({
  chess,
  fen,
  selectedSquare,
  legalMoves,
  lastMove,
  cameraView,
  settings,
  onSquareClick,
  orientation = 'w',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Keep latest onSquareClick callback without triggering scene teardown
  const onSquareClickRef = useRef(onSquareClick);
  useEffect(() => {
    onSquareClickRef.current = onSquareClick;
  }, [onSquareClick]);

  // Dedicated scene sub-groups
  const piecesGroupRef = useRef<THREE.Group>(new THREE.Group());
  const highlightsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const tilesMapRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Piece mesh registry: square -> THREE.Group
  const pieceMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  // Active piece movement animations
  const animatingPiecesRef = useRef<AnimatedPiece[]>([]);
  // Active piece capture dissolving animations
  const capturingPiecesRef = useRef<CapturedPieceAnim[]>([]);

  // Track currently selected square in a ref for the frame animation loop
  const selectedSquareRef = useRef<string | null>(selectedSquare);
  useEffect(() => {
    selectedSquareRef.current = selectedSquare;
  }, [selectedSquare]);

  // Camera animation target
  const cameraTargetRef = useRef<{
    pos: THREE.Vector3;
    target: THREE.Vector3;
    active: boolean;
  }>({
    pos: new THREE.Vector3(0, 14, 15),
    target: new THREE.Vector3(0, 0, 0),
    active: false,
  });

  // Cached materials for pieces and accents
  const materialsRef = useRef<{
    whitePiece: THREE.MeshStandardMaterial;
    whiteAccent: THREE.MeshStandardMaterial;
    blackPiece: THREE.MeshStandardMaterial;
    blackAccent: THREE.MeshStandardMaterial;
  }>({
    whitePiece: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.16,
      metalness: 0.22,
    }),
    whiteAccent: new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.0,
      roughness: 0.08,
      metalness: 0.85,
    }),
    blackPiece: new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.20,
      metalness: 0.70,
      emissive: 0x040814,
      emissiveIntensity: 0.4,
    }),
    blackAccent: new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x00d2ff,
      emissiveIntensity: 1.1,
      roughness: 0.08,
      metalness: 0.9,
    }),
  });

  // Convert algebraic square ('e4') to 3D board coordinates (x, z)
  const squareToCoords = useCallback((square: string): { x: number; z: number } => {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0 to 7
    const rank = parseInt(square[1], 10) - 1; // 0 to 7
    const x = (file - 3.5) * 1.0;
    const z = (3.5 - rank) * 1.0;
    return { x, z };
  }, []);

  // Compute responsive camera distance and height so the full board is comfortably visible
  const getCameraPresetDistance = useCallback((preset: CameraView) => {
    const container = mountRef.current;
    const width = container?.clientWidth || window.innerWidth;
    const height = container?.clientHeight || window.innerHeight;
    const aspect = width / height;

    // Board bounding radius (half diagonal of 9.2x9.2 frame is ~6.5)
    // We add margin so HUD elements never overlap the board tiles
    let targetDist: number;
    let targetHeight: number;

    if (aspect < 0.65) {
      // Narrow mobile phones (portrait) - zoom out with generous clearance
      targetDist = 18.5;
      targetHeight = 17.5;
    } else if (aspect < 1.0) {
      // Standard mobile / portrait tablets
      targetDist = 16.0;
      targetHeight = 15.0;
    } else {
      // Desktop / landscape tablets
      targetDist = 12.8;
      targetHeight = 12.0;
    }

    let targetPos = new THREE.Vector3(0, targetHeight, targetDist);
    const lookAt = new THREE.Vector3(0, 0, 0);

    switch (preset) {
      case 'white':
        targetPos = new THREE.Vector3(0, targetHeight, targetDist);
        break;
      case 'black':
        targetPos = new THREE.Vector3(0, targetHeight, -targetDist);
        break;
      case 'top':
        targetPos = new THREE.Vector3(0, aspect < 1.0 ? 24.0 : 17.5, 0.05);
        break;
      case 'isometric':
        const isoSpread = aspect < 1.0 ? 13.5 : 9.5;
        targetPos = new THREE.Vector3(isoSpread, targetHeight, isoSpread);
        break;
    }

    return { pos: targetPos, target: lookAt };
  }, []);

  // Sync pieces from chess instance to 3D meshes
  const syncPieces = useCallback(
    (animate: boolean) => {
      const piecesGroup = piecesGroupRef.current;
      const board = chess.board();
      const currentPieceMap = new Map<string, { type: PieceType; color: PieceColor }>();

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece) {
            const file = String.fromCharCode('a'.charCodeAt(0) + c);
            const rank = 8 - r;
            currentPieceMap.set(`${file}${rank}`, {
              type: piece.type as PieceType,
              color: piece.color as PieceColor,
            });
          }
        }
      }

      // Determine animation duration
      let animDuration = 0.32;
      if (settings.animationSpeed === 'instant') animDuration = 0.01;
      else if (settings.animationSpeed === 'fast') animDuration = 0.20;
      else if (settings.animationSpeed === 'cinematic') animDuration = 0.50;

      // Handle smooth move animation if requested
      if (animate && lastMove && pieceMeshesRef.current.has(lastMove.from)) {
        const movedMesh = pieceMeshesRef.current.get(lastMove.from)!;
        pieceMeshesRef.current.delete(lastMove.from);

        // If destination square had a piece (capture), start satisfying capture animation
        if (pieceMeshesRef.current.has(lastMove.to)) {
          const capturedMesh = pieceMeshesRef.current.get(lastMove.to)!;
          pieceMeshesRef.current.delete(lastMove.to);

          capturingPiecesRef.current.push({
            group: capturedMesh,
            startTime: performance.now(),
            duration: 0.42,
            startY: capturedMesh.position.y || 0.05,
          });
        }

        const { x: targetX, z: targetZ } = squareToCoords(lastMove.to);

        animatingPiecesRef.current.push({
          id: `${lastMove.from}-${lastMove.to}-${Date.now()}`,
          group: movedMesh,
          startX: movedMesh.position.x,
          startZ: movedMesh.position.z,
          startY: 0.05,
          targetX,
          targetZ,
          targetY: 0.05,
          progress: 0,
          duration: animDuration,
        });

        movedMesh.userData.square = lastMove.to;
        pieceMeshesRef.current.set(lastMove.to, movedMesh);
      }

      // Remove pieces no longer on the board (unless currently undergoing capture animation)
      const existingSquares = Array.from(pieceMeshesRef.current.keys());
      for (const sq of existingSquares) {
        if (!currentPieceMap.has(sq)) {
          const mesh = pieceMeshesRef.current.get(sq);
          if (mesh) {
            piecesGroup.remove(mesh);
          }
          pieceMeshesRef.current.delete(sq);
        }
      }

      // Add or reconcile current pieces
      currentPieceMap.forEach((pieceData, sq) => {
        const { x, z } = squareToCoords(sq);
        const isWhite = pieceData.color === 'w';
        const existingMesh = pieceMeshesRef.current.get(sq);

        if (existingMesh) {
          // Check if piece type or color changed (e.g. pawn promotion)
          if (
            existingMesh.userData.type !== pieceData.type ||
            existingMesh.userData.color !== pieceData.color
          ) {
            piecesGroup.remove(existingMesh);
            pieceMeshesRef.current.delete(sq);
          } else {
            // Mesh already matches. Ensure it is attached to piecesGroup
            if (existingMesh.parent !== piecesGroup) {
              piecesGroup.add(existingMesh);
            }
            // If not currently undergoing an active move animation, snap x and z
            const isAnimating = animatingPiecesRef.current.some((a) => a.group === existingMesh);
            if (!isAnimating) {
              existingMesh.position.x = x;
              existingMesh.position.z = z;
            }
            return;
          }
        }

        // Create new piece mesh
        const pieceMesh = createPieceMesh(
          pieceData.type,
          isWhite ? materialsRef.current.whitePiece : materialsRef.current.blackPiece,
          isWhite ? materialsRef.current.whiteAccent : materialsRef.current.blackAccent
        );

        pieceMesh.position.set(x, 0.05, z);
        // Orient knight to face opponent
        if (pieceData.type === 'n') {
          pieceMesh.rotation.y = isWhite ? 0 : Math.PI;
        }
        pieceMesh.userData = {
          square: sq,
          type: pieceData.type,
          color: pieceData.color,
        };

        piecesGroup.add(pieceMesh);
        pieceMeshesRef.current.set(sq, pieceMesh);
      });
    },
    [chess, lastMove, settings.animationSpeed, squareToCoords]
  );

  // Update camera presets smoothly
  const applyCameraPreset = useCallback(
    (preset: CameraView) => {
      if (!cameraRef.current || !controlsRef.current) return;
      const { pos, target } = getCameraPresetDistance(preset);

      cameraTargetRef.current = {
        pos,
        target,
        active: true,
      };
    },
    [getCameraPresetDistance]
  );

  useEffect(() => {
    applyCameraPreset(cameraView);
  }, [cameraView, applyCameraPreset]);

  // Main Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x030712); // Deep navy black
    scene.fog = new THREE.FogExp2(0x030712, 0.028);

    // Initial camera positioning
    const { pos } = getCameraPresetDistance(orientation === 'b' ? 'black' : 'white');
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 120);
    camera.position.copy(pos);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls with smooth damping and extended zoom bounds
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.minDistance = 6.0;
    controls.maxDistance = 50.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.2);
    scene.add(ambientLight);

    // Directional Key Light with soft shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(7, 16, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 38;
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    // Electric Cyan Rim Light for glowing piece profiles
    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.6);
    rimLight.position.set(-8, 9, -8);
    scene.add(rimLight);

    // Subtle upward ground bounce light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    fillLight.position.set(0, -5, 0);
    scene.add(fillLight);

    // 4 Corner neon accent point lights
    const cornerLights = [
      { x: 4.8, z: 4.8 },
      { x: -4.8, z: 4.8 },
      { x: 4.8, z: -4.8 },
      { x: -4.8, z: -4.8 },
    ];
    cornerLights.forEach(({ x, z }) => {
      const pl = new THREE.PointLight(0x00f0ff, 1.8, 8.0);
      pl.position.set(x, 0.45, z);
      scene.add(pl);
    });

    // Ambient floating dust particles
    const particleCount = 220;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 30;
      particlePositions[i + 1] = Math.random() * 14 - 2;
      particlePositions[i + 2] = (Math.random() - 0.5) * 30;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.05,
      transparent: true,
      opacity: 0.35,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Ground Grid
    const gridHelper = new THREE.GridHelper(32, 32, 0x00f0ff, 0x0f172a);
    gridHelper.position.y = -0.55;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.22;
    scene.add(gridHelper);

    // Board Base & Frame
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Outer Beveled Frame
    const frameGeom = new THREE.BoxGeometry(9.2, 0.5, 9.2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x050a14,
      roughness: 0.35,
      metalness: 0.8,
    });
    const frameMesh = new THREE.Mesh(frameGeom, frameMat);
    frameMesh.position.y = -0.26;
    frameMesh.receiveShadow = true;
    boardGroup.add(frameMesh);

    // Electric Cyan Underglow Strip
    const glowStripGeom = new THREE.BoxGeometry(9.3, 0.06, 9.3);
    const glowStripMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.3,
      roughness: 0.1,
    });
    const glowStrip = new THREE.Mesh(glowStripGeom, glowStripMat);
    glowStrip.position.y = -0.42;
    boardGroup.add(glowStrip);

    // Inner Board Surface Bevel
    const innerBaseGeom = new THREE.BoxGeometry(8.24, 0.12, 8.24);
    const innerBaseMat = new THREE.MeshStandardMaterial({
      color: 0x0a101f,
      roughness: 0.25,
      metalness: 0.6,
    });
    const innerBaseMesh = new THREE.Mesh(innerBaseGeom, innerBaseMat);
    innerBaseMesh.position.y = -0.06;
    innerBaseMesh.receiveShadow = true;
    boardGroup.add(innerBaseMesh);

    // Build the 64 Tiles
    const tileGeom = new THREE.BoxGeometry(0.98, 0.08, 0.98);

    const darkTileMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep slate navy
      roughness: 0.28,
      metalness: 0.65,
    });

    const lightTileMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Frosted titanium slate
      roughness: 0.22,
      metalness: 0.45,
    });

    tilesMapRef.current.clear();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isDark = (row + col) % 2 === 0;
        const fileChar = String.fromCharCode('a'.charCodeAt(0) + col);
        const rankNum = row + 1;
        const squareKey = `${fileChar}${rankNum}`;

        const tileMesh = new THREE.Mesh(tileGeom, isDark ? darkTileMat : lightTileMat);
        const x = (col - 3.5) * 1.0;
        const z = (3.5 - row) * 1.0;

        tileMesh.position.set(x, 0.0, z);
        tileMesh.receiveShadow = true;
        tileMesh.userData = { square: squareKey };

        boardGroup.add(tileMesh);
        tilesMapRef.current.set(squareKey, tileMesh);
      }
    }

    // Attach pieces group & highlights group to scene
    scene.add(piecesGroupRef.current);
    scene.add(highlightsGroupRef.current);

    // Immediately synchronize pieces onto the board
    syncPieces(false);

    // Pointer Raycaster Interaction with drag threshold
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const domElem = renderer.domElement;

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownPos = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!mountRef.current || !cameraRef.current) return;
      if (event.button !== 0) return; // Only primary click / touch

      const dx = event.clientX - pointerDownPos.x;
      const dy = event.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 8) {
        // User was orbiting / rotating camera, not clicking
        return;
      }

      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);

      // Check intersection against tiles and piece groups
      const targets = [
        ...Array.from(tilesMapRef.current.values()),
        piecesGroupRef.current,
      ];

      const intersects = raycaster.intersectObjects(targets, true);

      if (intersects.length > 0) {
        let hitSquare: string | null = null;
        for (const hit of intersects) {
          let curr: THREE.Object3D | null = hit.object;
          while (curr && curr !== scene) {
            if (curr.userData && curr.userData.square) {
              hitSquare = curr.userData.square;
              break;
            }
            curr = curr.parent;
          }
          if (hitSquare) break;
        }

        if (hitSquare) {
          onSquareClickRef.current(hitSquare);
        }
      }
    };

    domElem.addEventListener('pointerdown', handlePointerDown);
    domElem.addEventListener('pointerup', handlePointerUp);

    // Responsive Window / Container Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Slowly rotate particle dust
      particles.rotation.y += delta * 0.02;

      // Update camera smooth transition if active
      if (cameraTargetRef.current.active && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(cameraTargetRef.current.pos, delta * 3.5);
        controlsRef.current.target.lerp(cameraTargetRef.current.target, delta * 3.5);

        if (cameraRef.current.position.distanceTo(cameraTargetRef.current.pos) < 0.05) {
          cameraTargetRef.current.active = false;
        }
      }

      // 1. Update active piece movement animations (parabolic arc)
      if (animatingPiecesRef.current.length > 0) {
        const remaining: AnimatedPiece[] = [];
        for (const anim of animatingPiecesRef.current) {
          anim.progress += delta / anim.duration;
          const t = Math.min(anim.progress, 1.0);

          // Ease out cubic
          const easeT = 1 - Math.pow(1 - t, 3);
          const currentX = THREE.MathUtils.lerp(anim.startX, anim.targetX, easeT);
          const currentZ = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, easeT);

          // Parabolic arc for height: rises and lands softly
          const arcHeight = 0.65 * Math.sin(t * Math.PI);
          const currentY = THREE.MathUtils.lerp(anim.startY, anim.targetY, easeT) + arcHeight;

          anim.group.position.set(currentX, currentY, currentZ);

          if (t < 1.0) {
            remaining.push(anim);
          } else {
            anim.group.position.set(anim.targetX, anim.targetY, anim.targetZ);
          }
        }
        animatingPiecesRef.current = remaining;
      }

      // 2. Selected Piece Lift & Subtle Hover Effect
      const currentSelected = selectedSquareRef.current;
      pieceMeshesRef.current.forEach((mesh, sq) => {
        // Skip if mesh is currently moving
        const isMoving = animatingPiecesRef.current.some((a) => a.group === mesh);
        if (isMoving) return;

        if (sq === currentSelected) {
          // Subtle lift effect: floats at y=0.22 with a gentle breathing hover oscillation
          const hoverY = 0.22 + Math.sin(elapsedTime * 4.5) * 0.035;
          mesh.position.y += (hoverY - mesh.position.y) * Math.min(delta * 12.0, 1.0);
        } else {
          // Settles softly back down to board surface (y=0.05)
          if (mesh.position.y > 0.051) {
            mesh.position.y += (0.05 - mesh.position.y) * Math.min(delta * 14.0, 1.0);
          } else {
            mesh.position.y = 0.05;
          }
        }
      });

      // 3. Satisfying Capture Dissolve Animation
      if (capturingPiecesRef.current.length > 0) {
        const now = performance.now();
        const activeCaptures: CapturedPieceAnim[] = [];

        for (const cap of capturingPiecesRef.current) {
          const elapsed = (now - cap.startTime) / 1000;
          const t = Math.min(elapsed / cap.duration, 1.0);

          // Piece lifts up, rotates slightly, and scales down smoothly to 0
          const scale = Math.max(0, 1.0 - Math.pow(t, 2));
          cap.group.scale.set(scale, scale, scale);
          cap.group.position.y = cap.startY + t * 0.75;
          cap.group.rotation.y += delta * 6.5;

          if (t < 1.0) {
            activeCaptures.push(cap);
          } else {
            piecesGroupRef.current.remove(cap.group);
          }
        }
        capturingPiecesRef.current = activeCaptures;
      }

      controlsRef.current?.update();
      rendererRef.current?.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      domElem.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      piecesGroupRef.current.clear();
      pieceMeshesRef.current.clear();
      tilesMapRef.current.clear();
      highlightsGroupRef.current.clear();
      capturingPiecesRef.current = [];
    };
  }, [orientation, syncPieces, getCameraPresetDistance]);

  // Synchronize pieces whenever FEN or lastMove changes
  useEffect(() => {
    syncPieces(true);
  }, [fen, lastMove, syncPieces]);

  // Update Visual Highlights (Selected Square, Legal Moves, Check Alert, Last Move)
  useEffect(() => {
    const highlightsGroup = highlightsGroupRef.current;
    if (!highlightsGroup) return;

    // Clear old highlight meshes
    while (highlightsGroup.children.length > 0) {
      const child = highlightsGroup.children[0];
      highlightsGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }

    if (!settings.showHighlights) return;

    // 1. Last Move Highlights (subtle holographic cyan tiles)
    if (lastMove) {
      [lastMove.from, lastMove.to].forEach((sq) => {
        const { x, z } = squareToCoords(sq);
        const geom = new THREE.PlaneGeometry(0.96, 0.96);
        geom.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, 0.045, z);
        highlightsGroup.add(mesh);
      });
    }

    // 2. Selected Square Highlight (Premium electric-blue glowing bracket outline + soft pad)
    if (selectedSquare) {
      const { x, z } = squareToCoords(selectedSquare);

      // Floor glow pad
      const padGeom = new THREE.PlaneGeometry(0.96, 0.96);
      padGeom.rotateX(-Math.PI / 2);
      const padMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });
      const padMesh = new THREE.Mesh(padGeom, padMat);
      padMesh.position.set(x, 0.046, z);
      highlightsGroup.add(padMesh);

      // Electric blue glowing perimeter border ring (replaces any red circles)
      const borderGeom = new THREE.RingGeometry(0.40, 0.47, 32);
      borderGeom.rotateX(-Math.PI / 2);
      const borderMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      });
      const borderMesh = new THREE.Mesh(borderGeom, borderMat);
      borderMesh.position.set(x, 0.048, z);
      highlightsGroup.add(borderMesh);

      // 4 Precision corner bracket accents in electric cyan
      const cornerSize = 0.16;
      const cornerThick = 0.035;
      const offset = 0.44;
      const corners = [
        { cx: x - offset, cz: z - offset },
        { cx: x + offset, cz: z - offset },
        { cx: x - offset, cz: z + offset },
        { cx: x + offset, cz: z + offset },
      ];

      corners.forEach(({ cx, cz }) => {
        const cGeom = new THREE.PlaneGeometry(cornerSize, cornerThick);
        cGeom.rotateX(-Math.PI / 2);
        const cMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        });
        const cMesh = new THREE.Mesh(cGeom, cMat);
        cMesh.position.set(cx, 0.049, cz);
        highlightsGroup.add(cMesh);
      });
    }

    // 3. Legal Destination Moves (Elegant subtle glowing indicators & tactical capture reticles)
    legalMoves.forEach((sq) => {
      const { x, z } = squareToCoords(sq);
      const isTargetOccupied = chess.get(sq as any) !== null;

      if (isTargetOccupied) {
        // Consistent, refined tactical corner crosshairs for capture moves
        const reticleGeom = new THREE.RingGeometry(0.34, 0.44, 28);
        reticleGeom.rotateX(-Math.PI / 2);
        const reticleMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b, // Refined amber-gold tactical targeting reticle
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        });
        const reticleMesh = new THREE.Mesh(reticleGeom, reticleMat);
        reticleMesh.position.set(x, 0.049, z);
        highlightsGroup.add(reticleMesh);

        // Inner glowing dot
        const dotGeom = new THREE.CircleGeometry(0.08, 16);
        dotGeom.rotateX(-Math.PI / 2);
        const dotMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.9,
        });
        const dotMesh = new THREE.Mesh(dotGeom, dotMat);
        dotMesh.position.set(x, 0.049, z);
        highlightsGroup.add(dotMesh);
      } else {
        // Elegant subtle glowing cyan dot + soft halo for move destinations
        const dotGeom = new THREE.CircleGeometry(0.12, 24);
        dotGeom.rotateX(-Math.PI / 2);
        const dotMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          transparent: true,
          opacity: 0.85,
        });
        const dotMesh = new THREE.Mesh(dotGeom, dotMat);
        dotMesh.position.set(x, 0.049, z);
        highlightsGroup.add(dotMesh);

        // Thin outer halo
        const haloGeom = new THREE.RingGeometry(0.20, 0.25, 24);
        haloGeom.rotateX(-Math.PI / 2);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        });
        const haloMesh = new THREE.Mesh(haloGeom, haloMat);
        haloMesh.position.set(x, 0.048, z);
        highlightsGroup.add(haloMesh);
      }
    });

    // 4. In Check Highlight (Subtle crimson aura under the checked king)
    if (chess.isCheck()) {
      const turn = chess.turn();
      const board = chess.board();
      let kingSquare: string | null = null;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.type === 'k' && piece.color === turn) {
            const file = String.fromCharCode('a'.charCodeAt(0) + c);
            const rank = 8 - r;
            kingSquare = `${file}${rank}`;
            break;
          }
        }
        if (kingSquare) break;
      }

      if (kingSquare) {
        const { x, z } = squareToCoords(kingSquare);
        const checkPadGeom = new THREE.PlaneGeometry(0.96, 0.96);
        checkPadGeom.rotateX(-Math.PI / 2);
        const checkPadMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        });
        const checkMesh = new THREE.Mesh(checkPadGeom, checkPadMat);
        checkMesh.position.set(x, 0.047, z);
        highlightsGroup.add(checkMesh);

        // Check warning ring
        const ringGeom = new THREE.RingGeometry(0.38, 0.46, 32);
        ringGeom.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf87171,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.position.set(x, 0.049, z);
        highlightsGroup.add(ringMesh);
      }
    }
  }, [chess, fen, legalMoves, selectedSquare, lastMove, settings.showHighlights, squareToCoords]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing outline-none select-none touch-none"
    />
  );
};
