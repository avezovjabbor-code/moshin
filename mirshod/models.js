// 3D Procedural Mesh Builder for Vehicles & City Environment using Three.js

const CAR_CATALOG = [
  {
    id: 'bmw_m5',
    name: 'BMW M5 F90 CS',
    badge: 'M-POWER',
    topSpeed: 330,
    accel: 9.4,
    handling: 8.8,
    nitro: 9.0,
    price: 0,
    color: '#0055ff',
    desc: '4.4L TwinPower Turbo V8, 635 ot kuchi. Afsonaviy drift va tezlik qiroli!'
  },
  {
    id: 'malibu_turbo',
    name: 'CHEVROLET MALIBU 2 TURBO',
    badge: 'PREMIER BLACK',
    topSpeed: 275,
    accel: 8.2,
    handling: 8.5,
    nitro: 8.2,
    price: 1500,
    color: '#111113',
    desc: '2.0L Turbo, Tanirovka qora stil, O\'zbekiston ko\'chalarining eng sevimli biznes sedani.'
  },
  {
    id: 'gentra_tuned',
    name: 'CHEVROLET GENTRA SPORT TUNED',
    badge: 'OPTRA SPORT',
    topSpeed: 250,
    accel: 7.8,
    handling: 9.2,
    nitro: 8.5,
    price: 800,
    color: '#ffffff',
    desc: 'Sport tuning, pasaytirilgan podveska, gaz-benzin, ko\'cha drift ustasi.'
  },
  {
    id: 'amg_gt',
    name: 'MERCEDES-BENZ AMG GT',
    badge: 'V8 BITURBO',
    topSpeed: 340,
    accel: 9.6,
    handling: 9.4,
    nitro: 9.2,
    price: 3200,
    color: '#109b43',
    desc: 'Afsonaviy nemis superkari, Panamericana panjarasi va aktiv sport spoyler.'
  },
  {
    id: 'lambo_aventador',
    name: 'LAMBORGHINI AVENTADOR',
    badge: 'V12 LP770',
    topSpeed: 370,
    accel: 9.9,
    handling: 9.6,
    nitro: 9.8,
    price: 6000,
    color: '#ff9900',
    desc: '770 ot kuchi, agressiv stealth qanotlar, neon ostki yoritish va ekstremal aerodinamika.'
  },
  {
    id: 'bugatti_chiron',
    name: 'BUGATTI CHIRON SUPER SPORT',
    badge: 'W16 QUAD-TURBO',
    topSpeed: 440,
    accel: 10.0,
    handling: 9.8,
    nitro: 10.0,
    price: 10000,
    color: '#082567',
    desc: '1600 ot kuchi, Yer yuzidagi eng tezkor giperkarlardan biri. Giper-tezlik!'
  }
];

class Car3DBuilder {
  constructor() {
    this.materials = {};
    this.initCommonMaterials();
  }

  initCommonMaterials() {
    this.matWheelRubber = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1
    });
    this.matWheelRim = new THREE.MeshStandardMaterial({
      color: 0xd0d0d0,
      roughness: 0.2,
      metalness: 0.9
    });
    this.matGlass = new THREE.MeshPhysicalMaterial({
      color: 0x050b14,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.9,
      reflectivity: 0.9
    });
    this.matHeadlight = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });
    this.matHeadlightGlow = new THREE.MeshBasicMaterial({
      color: 0x88ccff
    });
    this.matTaillight = new THREE.MeshBasicMaterial({
      color: 0xff1122
    });
    this.matBlackTrim = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.6,
      metalness: 0.4
    });
    this.matChrome = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.1,
      metalness: 0.95
    });
  }

  createWheel(radius = 0.38, width = 0.28) {
    const wheelGroup = new THREE.Group();
    // Tire
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
    const tire = new THREE.Mesh(tireGeo, this.matWheelRubber);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, width + 0.02, 12);
    const rim = new THREE.Mesh(rimGeo, this.matWheelRim);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    // Rim center cap
    const capGeo = new THREE.CylinderGeometry(radius * 0.25, radius * 0.25, width + 0.04, 8);
    const cap = new THREE.Mesh(capGeo, this.matChrome);
    cap.rotation.z = Math.PI / 2;
    wheelGroup.add(cap);

    return wheelGroup;
  }

  buildCar(carType, bodyColorHex) {
    const root = new THREE.Group();
    const color = new THREE.Color(bodyColorHex || 0x0066ff);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.75,
      roughness: 0.25
    });

    const isLambo = carType === 'lambo_aventador';
    const isBugatti = carType === 'bugatti_chiron';
    const isAmg = carType === 'amg_gt';
    const isMalibu = carType === 'malibu_turbo';
    const isGentra = carType === 'gentra_tuned';

    // Base Dimensions
    let w = 2.05, h = 0.85, l = 4.6;
    if (isLambo) { w = 2.15; h = 0.68; l = 4.7; }
    if (isBugatti) { w = 2.18; h = 0.74; l = 4.8; }
    if (isAmg) { w = 2.05; h = 0.76; l = 4.65; }
    if (isGentra) { w = 1.95; h = 0.92; l = 4.4; }
    if (isMalibu) { w = 2.08; h = 0.88; l = 4.85; }

    // Main Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(w, h * 0.5, l);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = h * 0.45;
    chassis.castShadow = true;
    root.add(chassis);

    // Cabin / Roof
    let cabinW = w * 0.82;
    let cabinH = h * 0.55;
    let cabinL = l * 0.48;
    let cabinZ = -0.2;

    if (isLambo) {
      cabinW = w * 0.76;
      cabinH = h * 0.6;
      cabinL = l * 0.42;
      cabinZ = -0.1;
    } else if (isAmg) {
      cabinZ = -0.55; // long hood
      cabinL = l * 0.44;
    } else if (isMalibu) {
      cabinZ = -0.15;
      cabinL = l * 0.52;
    } else if (isGentra) {
      cabinZ = -0.05;
      cabinL = l * 0.54;
    }

    const cabinGeo = new THREE.BoxGeometry(cabinW, cabinH, cabinL);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, h * 0.88, cabinZ);
    cabin.castShadow = true;
    root.add(cabin);

    // Windshield (front)
    const frontWindshieldGeo = new THREE.BoxGeometry(cabinW * 0.96, cabinH * 0.85, 0.1);
    const frontWindshield = new THREE.Mesh(frontWindshieldGeo, this.matGlass);
    frontWindshield.position.set(0, h * 0.86, cabinZ + cabinL * 0.5 + 0.05);
    frontWindshield.rotation.x = 0.4;
    root.add(frontWindshield);

    // Rear Windshield
    const rearWindshieldGeo = new THREE.BoxGeometry(cabinW * 0.94, cabinH * 0.8, 0.1);
    const rearWindshield = new THREE.Mesh(rearWindshieldGeo, this.matGlass);
    rearWindshield.position.set(0, h * 0.86, cabinZ - cabinL * 0.5 - 0.05);
    rearWindshield.rotation.x = -0.45;
    root.add(rearWindshield);

    // Side Windows
    const sideWinL = new THREE.Mesh(new THREE.BoxGeometry(0.06, cabinH * 0.7, cabinL * 0.88), this.matGlass);
    sideWinL.position.set(-cabinW * 0.5 - 0.01, h * 0.88, cabinZ);
    root.add(sideWinL);

    const sideWinR = new THREE.Mesh(new THREE.BoxGeometry(0.06, cabinH * 0.7, cabinL * 0.88), this.matGlass);
    sideWinR.position.set(cabinW * 0.5 + 0.01, h * 0.88, cabinZ);
    root.add(sideWinR);

    // Hood scoop / Details
    const hoodL = (l * 0.5 - cabinL * 0.5) * 0.9;
    const hoodGeo = new THREE.BoxGeometry(w * 0.85, 0.12, hoodL);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, h * 0.65, cabinZ + cabinL * 0.5 + hoodL * 0.5 * 0.8);
    hood.rotation.x = -0.06;
    root.add(hood);

    // Front Grille & Bumper
    const grilleGeo = new THREE.BoxGeometry(w * 0.7, h * 0.35, 0.2);
    const grille = new THREE.Mesh(grilleGeo, this.matBlackTrim);
    grille.position.set(0, h * 0.35, l * 0.5);
    root.add(grille);

    // Brand Specifics
    if (carType === 'bmw_m5') {
      // Iconic BMW Kidney Grilles
      const kid1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.24), this.matChrome);
      kid1.position.set(-0.25, h * 0.42, l * 0.5 + 0.01);
      const kid2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.24), this.matChrome);
      kid2.position.set(0.25, h * 0.42, l * 0.5 + 0.01);
      root.add(kid1, kid2);
    } else if (isBugatti) {
      // Horseshoe Grille
      const horse = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16), this.matChrome);
      horse.position.set(0, h * 0.38, l * 0.5 + 0.02);
      horse.rotation.x = Math.PI / 2;
      root.add(horse);
    }

    // Headlights (Front)
    const hlW = 0.4, hlH = 0.14;
    const headL = new THREE.Mesh(new THREE.BoxGeometry(hlW, hlH, 0.15), this.matHeadlight);
    headL.position.set(-w * 0.36, h * 0.48, l * 0.5 + 0.02);
    const headR = new THREE.Mesh(new THREE.BoxGeometry(hlW, hlH, 0.15), this.matHeadlight);
    headR.position.set(w * 0.36, h * 0.48, l * 0.5 + 0.02);
    root.add(headL, headR);

    // Headlight Beams (Spotlights / Cones)
    const beamGeo = new THREE.ConeGeometry(2.5, 14, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xcceeff,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });

    const beamL = new THREE.Mesh(beamGeo, beamMat);
    beamL.rotation.x = -Math.PI / 2;
    beamL.position.set(-w * 0.36, h * 0.48, l * 0.5 + 7.0);
    root.add(beamL);

    const beamR = new THREE.Mesh(beamGeo, beamMat);
    beamR.rotation.x = -Math.PI / 2;
    beamR.position.set(w * 0.36, h * 0.48, l * 0.5 + 7.0);
    root.add(beamR);

    // Taillights (Rear)
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(hlW * 1.1, 0.12, 0.15), this.matTaillight);
    tailL.position.set(-w * 0.36, h * 0.5, -l * 0.5 - 0.02);
    const tailR = new THREE.Mesh(new THREE.BoxGeometry(hlW * 1.1, 0.12, 0.15), this.matTaillight);
    tailR.position.set(w * 0.36, h * 0.5, -l * 0.5 - 0.02);
    root.add(tailL, tailR);

    // Rear Spoiler / Wing
    if (isLambo || isAmg || isBugatti || isGentra) {
      const spoilerWingGeo = new THREE.BoxGeometry(w * 0.95, 0.06, 0.4);
      const spoilerWing = new THREE.Mesh(spoilerWingGeo, this.matBlackTrim);
      spoilerWing.position.set(0, h * 0.95, -l * 0.46);

      const standL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.12), this.matBlackTrim);
      standL.position.set(-w * 0.35, h * 0.78, -l * 0.46);

      const standR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.12), this.matBlackTrim);
      standR.position.set(w * 0.35, h * 0.78, -l * 0.46);

      root.add(spoilerWing, standL, standR);
    }

    // Exhaust Pipes
    const exhGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8);
    const exhL = new THREE.Mesh(exhGeo, this.matChrome);
    exhL.rotation.x = Math.PI / 2;
    exhL.position.set(-0.4, 0.2, -l * 0.5 - 0.1);

    const exhR = new THREE.Mesh(exhGeo, this.matChrome);
    exhR.rotation.x = Math.PI / 2;
    exhR.position.set(0.4, 0.2, -l * 0.5 - 0.1);
    root.add(exhL, exhR);

    // Nitro Thruster Nodes
    const nitroPort = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    nitroPort.rotation.x = Math.PI / 2;
    nitroPort.position.set(0, 0.22, -l * 0.5 - 0.1);
    root.add(nitroPort);

    // 4 Wheels
    const wheelR = 0.36;
    const wheelW = 0.26;
    const wheelPosZ = l * 0.32;
    const wheelPosX = w * 0.5;

    const wFL = this.createWheel(wheelR, wheelW);
    wFL.position.set(-wheelPosX, wheelR, wheelPosZ);
    const wFR = this.createWheel(wheelR, wheelW);
    wFR.position.set(wheelPosX, wheelR, wheelPosZ);
    const wRL = this.createWheel(wheelR, wheelW);
    wRL.position.set(-wheelPosX, wheelR, -wheelPosZ);
    const wRR = this.createWheel(wheelR, wheelW);
    wRR.position.set(wheelPosX, wheelR, -wheelPosZ);

    root.add(wFL, wFR, wRL, wRR);
    root.userData.wheels = [wFL, wFR, wRL, wRR];
    root.userData.frontWheels = [wFL, wFR];
    root.userData.bodyMat = bodyMat;
    root.userData.nitroPort = nitroPort;
    root.userData.type = carType;

    return root;
  }

  buildTrafficCar(type = 'sedan') {
    const root = new THREE.Group();

    if (type === 'damas') {
      // Classic White Damas Minivan
      const damasMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5 });
      const vanGeo = new THREE.BoxGeometry(1.6, 1.6, 3.4);
      const van = new THREE.Mesh(vanGeo, damasMat);
      van.position.y = 1.0;
      van.castShadow = true;
      root.add(van);

      // Windshield
      const winGeo = new THREE.BoxGeometry(1.4, 0.65, 0.1);
      const win = new THREE.Mesh(winGeo, this.matGlass);
      win.position.set(0, 1.25, 1.7);
      root.add(win);

      // Headlights
      const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), this.matHeadlight);
      hlL.position.set(-0.55, 0.75, 1.71);
      const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), this.matHeadlight);
      hlR.position.set(0.55, 0.75, 1.71);
      root.add(hlL, hlR);

      // Wheels
      const w1 = this.createWheel(0.3, 0.2); w1.position.set(-0.8, 0.3, 1.1);
      const w2 = this.createWheel(0.3, 0.2); w2.position.set(0.8, 0.3, 1.1);
      const w3 = this.createWheel(0.3, 0.2); w3.position.set(-0.8, 0.3, -1.1);
      const w4 = this.createWheel(0.3, 0.2); w4.position.set(0.8, 0.3, -1.1);
      root.add(w1, w2, w3, w4);
      root.userData.wheels = [w1, w2, w3, w4];
      root.userData.width = 1.7;
      root.userData.length = 3.6;
      return root;
    }

    if (type === 'truck') {
      // Heavy Cargo Truck
      const truckMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 });
      const cabGeo = new THREE.BoxGeometry(2.3, 2.2, 2.4);
      const cab = new THREE.Mesh(cabGeo, truckMat);
      cab.position.set(0, 1.4, 3.0);
      cab.castShadow = true;
      root.add(cab);

      // Container
      const contMat = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.6 });
      const contGeo = new THREE.BoxGeometry(2.4, 2.6, 6.2);
      const cont = new THREE.Mesh(contGeo, contMat);
      cont.position.set(0, 1.7, -1.5);
      cont.castShadow = true;
      root.add(cont);

      // Wheels
      const w1 = this.createWheel(0.48, 0.3); w1.position.set(-1.15, 0.48, 3.2);
      const w2 = this.createWheel(0.48, 0.3); w2.position.set(1.15, 0.48, 3.2);
      const w3 = this.createWheel(0.48, 0.3); w3.position.set(-1.15, 0.48, -0.6);
      const w4 = this.createWheel(0.48, 0.3); w4.position.set(1.15, 0.48, -0.6);
      const w5 = this.createWheel(0.48, 0.3); w5.position.set(-1.15, 0.48, -3.2);
      const w6 = this.createWheel(0.48, 0.3); w6.position.set(1.15, 0.48, -3.2);
      root.add(w1, w2, w3, w4, w5, w6);
      root.userData.wheels = [w1, w2, w3, w4, w5, w6];
      root.userData.width = 2.5;
      root.userData.length = 8.6;
      return root;
    }

    if (type === 'taxi') {
      // Yellow Taxi
      const taxiMat = new THREE.MeshStandardMaterial({ color: 0xf5b800, roughness: 0.3, metalness: 0.6 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 4.2), taxiMat);
      body.position.y = 0.55;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 2.1), taxiMat);
      cab.position.set(0, 1.1, -0.1);

      // Taxi roof light
      const roofSign = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.25), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      roofSign.position.set(0, 1.5, -0.1);

      root.add(body, cab, roofSign);
      const w1 = this.createWheel(0.34, 0.22); w1.position.set(-0.95, 0.34, 1.3);
      const w2 = this.createWheel(0.34, 0.22); w2.position.set(0.95, 0.34, 1.3);
      const w3 = this.createWheel(0.34, 0.22); w3.position.set(-0.95, 0.34, -1.3);
      const w4 = this.createWheel(0.34, 0.22); w4.position.set(0.95, 0.34, -1.3);
      root.add(w1, w2, w3, w4);
      root.userData.wheels = [w1, w2, w3, w4];
      root.userData.width = 2.0;
      root.userData.length = 4.4;
      return root;
    }

    // Default: Silver Cobalt / Nexia Sedan
    const colors = [0xd6d6d6, 0x111111, 0x1f3c88, 0x7a1111];
    const col = colors[Math.floor(Math.random() * colors.length)];
    const sedanMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.65 });
    const bGeo = new THREE.BoxGeometry(1.9, 0.65, 4.3);
    const body = new THREE.Mesh(bGeo, sedanMat);
    body.position.y = 0.52;
    const cGeo = new THREE.BoxGeometry(1.6, 0.65, 2.2);
    const cab = new THREE.Mesh(cGeo, sedanMat);
    cab.position.set(0, 1.05, -0.1);
    root.add(body, cab);

    const w1 = this.createWheel(0.34, 0.22); w1.position.set(-0.95, 0.34, 1.3);
    const w2 = this.createWheel(0.34, 0.22); w2.position.set(0.95, 0.34, 1.3);
    const w3 = this.createWheel(0.34, 0.22); w3.position.set(-0.95, 0.34, -1.3);
    const w4 = this.createWheel(0.34, 0.22); w4.position.set(0.95, 0.34, -1.3);
    root.add(w1, w2, w3, w4);
    root.userData.wheels = [w1, w2, w3, w4];
    root.userData.width = 2.0;
    root.userData.length = 4.4;
    return root;
  }

  buildBuilding(height = 35, width = 14, depth = 16, theme = 'night') {
    const group = new THREE.Group();
    const bldMat = new THREE.MeshStandardMaterial({
      color: theme === 'night' ? 0x0a1020 : 0x2d3748,
      roughness: 0.7,
      metalness: 0.3
    });

    const bldMesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bldMat);
    bldMesh.position.y = height / 2;
    bldMesh.castShadow = true;
    group.add(bldMesh);

    // Glowing Neon Windows / Strips
    if (theme === 'night' || theme === 'cyber') {
      const windowColor = Math.random() > 0.5 ? 0x00f0ff : 0xffa500;
      const winStripGeo = new THREE.PlaneGeometry(width * 0.85, height * 0.7);
      const winStripMat = new THREE.MeshBasicMaterial({
        color: windowColor,
        transparent: true,
        opacity: 0.35,
        wireframe: true
      });
      const winStrip = new THREE.Mesh(winStripGeo, winStripMat);
      winStrip.position.set(0, height / 2, depth / 2 + 0.1);
      group.add(winStrip);

      // Roof Neon Spire
      if (Math.random() > 0.4) {
        const spire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.4, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xff0055 })
        );
        spire.position.set(0, height + 4, 0);
        group.add(spire);
      }
    }
    return group;
  }

  buildBillboard(text = 'TOSHKENT') {
    const group = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 8), postMat);
    post.position.y = 4;
    group.add(post);

    const boardMat = new THREE.MeshBasicMaterial({ color: 0x00f7ff });
    const board = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 0.4), boardMat);
    board.position.set(0, 8, 0);
    group.add(board);

    // Text Canvas Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#00f7ff';
    ctx.font = 'bold 54px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 120);
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 36px Rajdhani, sans-serif';
    ctx.fillText('SPEED & NITRO 3D', 256, 180);

    const texture = new THREE.CanvasTexture(canvas);
    const signFace = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 2.8), new THREE.MeshBasicMaterial({ map: texture }));
    signFace.position.set(0, 8, 0.22);
    group.add(signFace);

    return group;
  }

  buildCoin() {
    const coinGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.18, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xaa7700
    });
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.rotation.x = Math.PI / 2;
    coin.position.y = 0.9;
    return coin;
  }

  buildNitroCanister() {
    const group = new THREE.Group();
    const canGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
    const canMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0055aa
    });
    const can = new THREE.Mesh(canGeo, canMat);
    can.position.y = 0.9;
    group.add(can);

    const top = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), canMat);
    top.position.y = 1.5;
    group.add(top);
    return group;
  }

  buildMagnet() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xff2244, metalness: 0.6, roughness: 0.3, emissive: 0x660011 });
    const uGeo = new THREE.TorusGeometry(0.5, 0.15, 8, 16, Math.PI);
    const magnet = new THREE.Mesh(uGeo, mat);
    magnet.rotation.z = Math.PI;
    magnet.position.y = 1.0;
    group.add(magnet);
    return group;
  }

  buildShield() {
    const shieldGeo = new THREE.OctahedronGeometry(0.7, 1);
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x008855
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.y = 1.0;
    return shield;
  }
}

window.Car3DBuilder = Car3DBuilder;
