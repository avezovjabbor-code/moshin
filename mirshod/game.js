// AVTOPOLIGON: Super Mashinalar Poygasi 3D Game Engine

class RacingGame {
  constructor() {
    this.container = document.getElementById('game-viewport');
    this.builder = new Car3DBuilder();

    // Game States: 'MENU', 'PLAYING', 'PAUSED', 'CRASHED'
    this.state = 'MENU';
    this.currentTrack = 'night'; // 'night', 'sunset', 'cyber'
    this.cameraMode = 0; // 0: Chase, 1: Hood, 2: Close

    // Saved player data in localStorage
    this.loadUserData();

    // Active Car Selection
    this.selectedCarIndex = 0;
    this.selectedColor = CAR_CATALOG[0].color;

    // Movement & Physics
    this.speed = 0; // km/h
    this.targetSpeed = 0;
    this.rpm = 900;
    this.gear = 1;
    this.playerX = 0;
    this.playerZ = 0;
    this.steerAngle = 0;
    this.driftAngle = 0;
    this.roadWidth = 16.0;
    this.roadLimit = 7.2;

    // Boost & Powerups
    this.nitro = 100;
    this.isNitro = false;
    this.isDrifting = false;
    this.hasShield = false;
    this.magnetTimer = 0;
    this.shieldTimer = 0;

    // Stats
    this.score = 0;
    this.distance = 0; // km
    this.overtakes = 0;
    this.runCoins = 0;

    // Controls
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      nitro: false,
      drift: false
    };

    // World collections
    this.traffic = [];
    this.coins = [];
    this.powerups = [];
    this.roadSegments = [];
    this.scenery = [];
    this.particles = [];
    this.flameParticles = [];

    // Timing
    this.clock = new THREE.Clock();
    this.spawnTimer = 0;
    this.coinTimer = 0;

    this.initThree();
    this.buildRoad();
    this.setupGarageCar();
    this.setupEvents();
    this.updateGarageUI();
    this.animate();
  }

  loadUserData() {
    this.totalCoins = parseInt(localStorage.getItem('avto_coins') || '500', 10);
    this.highScore = parseInt(localStorage.getItem('avto_best_score') || '0', 10);
    this.bestDist = parseFloat(localStorage.getItem('avto_best_dist') || '0.0');
    
    // Unlocked cars list
    try {
      this.unlockedCars = JSON.parse(localStorage.getItem('avto_unlocked') || '["bmw_m5"]');
    } catch (e) {
      this.unlockedCars = ['bmw_m5'];
    }

    // Upgrades
    try {
      this.upgrades = JSON.parse(localStorage.getItem('avto_upgrades') || '{}');
    } catch (e) {
      this.upgrades = {};
    }
  }

  saveUserData() {
    localStorage.setItem('avto_coins', this.totalCoins);
    localStorage.setItem('avto_best_score', this.highScore);
    localStorage.setItem('avto_best_dist', this.bestDist.toFixed(1));
    localStorage.setItem('avto_unlocked', JSON.stringify(this.unlockedCars));
    localStorage.setItem('avto_upgrades', JSON.stringify(this.upgrades));
  }

  getCarUpgrades(carId) {
    if (!this.upgrades[carId]) {
      this.upgrades[carId] = { engine: 0, handling: 0, nitro: 0 };
    }
    return this.upgrades[carId];
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1200);
    this.camera.position.set(0, 4, -8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Track lighting setup
    this.ambientLight = new THREE.AmbientLight(0x223355, 1.2);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    this.sunLight.position.set(40, 60, -30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.scene.add(this.sunLight);

    // Fog
    this.scene.fog = new THREE.FogExp2(0x050a14, 0.007);
    this.renderer.setClearColor(0x050a14);

    this.applyTrackAtmosphere(this.currentTrack);
  }

  applyTrackAtmosphere(trackKey) {
    this.currentTrack = trackKey;
    if (trackKey === 'night') {
      this.scene.fog.color.setHex(0x040814);
      this.renderer.setClearColor(0x040814);
      this.ambientLight.color.setHex(0x1a2b4c);
      this.ambientLight.intensity = 1.0;
      this.sunLight.color.setHex(0x4466aa);
      this.sunLight.intensity = 0.8;
    } else if (trackKey === 'sunset') {
      this.scene.fog.color.setHex(0x2b101b);
      this.renderer.setClearColor(0x2b101b);
      this.ambientLight.color.setHex(0xff7744);
      this.ambientLight.intensity = 1.3;
      this.sunLight.color.setHex(0xffaa55);
      this.sunLight.intensity = 2.0;
    } else if (trackKey === 'cyber') {
      this.scene.fog.color.setHex(0x0d0322);
      this.renderer.setClearColor(0x0d0322);
      this.ambientLight.color.setHex(0x00f0ff);
      this.ambientLight.intensity = 1.1;
      this.sunLight.color.setHex(0xff00aa);
      this.sunLight.intensity = 1.2;
    }
  }

  buildRoad() {
    this.roadGroup = new THREE.Group();
    this.scene.add(this.roadGroup);

    // We build 20 road segments ahead and cycle them
    const segLength = 40;
    const numSegments = 25;

    for (let i = 0; i < numSegments; i++) {
      const seg = this.createRoadSegment(i * segLength, segLength);
      this.roadSegments.push(seg);
      this.roadGroup.add(seg);
    }
  }

  createRoadSegment(zPos, length) {
    const segGroup = new THREE.Group();
    segGroup.position.z = zPos;

    // Asphalt Main Road
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, length);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.8,
      metalness: 0.2
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    segGroup.add(road);

    // Road Markings (Yellow side lines, dashed white center lines)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    // Outer barriers / curb
    const curbGeo = new THREE.BoxGeometry(0.8, 0.4, length);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xd40022 });
    const curbL = new THREE.Mesh(curbGeo, curbMat);
    curbL.position.set(-this.roadWidth * 0.5 - 0.4, 0.2, 0);
    const curbR = new THREE.Mesh(curbGeo, curbMat);
    curbR.position.set(this.roadWidth * 0.5 + 0.4, 0.2, 0);
    segGroup.add(curbL, curbR);

    // Side safety stripes
    const sideStripGeo = new THREE.PlaneGeometry(0.2, length);
    const sideL = new THREE.Mesh(sideStripGeo, yellowMat);
    sideL.rotation.x = -Math.PI / 2;
    sideL.position.set(-this.roadWidth * 0.48, 0.01, 0);
    const sideR = new THREE.Mesh(sideStripGeo, yellowMat);
    sideR.rotation.x = -Math.PI / 2;
    sideR.position.set(this.roadWidth * 0.48, 0.01, 0);
    segGroup.add(sideL, sideR);

    // Dashed center lane dividers (4 lanes = 3 divider lines)
    const lanes = [-4.0, 0, 4.0];
    lanes.forEach(lx => {
      for (let dz = -length * 0.4; dz < length * 0.5; dz += 8) {
        const dashGeo = new THREE.PlaneGeometry(0.2, 4);
        const dash = new THREE.Mesh(dashGeo, lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(lx, 0.01, dz);
        segGroup.add(dash);
      }
    });

    // Street Light Poles along the sides
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.8 });
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 7, 8);
    const poleL = new THREE.Mesh(poleGeo, poleMat);
    poleL.position.set(-this.roadWidth * 0.5 - 1.8, 3.5, 0);
    segGroup.add(poleL);

    // Lamp light glow
    const lampGlowGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffeeaa });
    const lamp = new THREE.Mesh(lampGlowGeo, lampMat);
    lamp.position.set(-this.roadWidth * 0.5 - 1.0, 7.0, 0);
    segGroup.add(lamp);

    // Scenery: Skyscrapers / Neon billboards on sides
    if (Math.random() > 0.3) {
      const bHeight = 25 + Math.random() * 45;
      const bldLeft = this.builder.buildBuilding(bHeight, 12, 14, this.currentTrack);
      bldLeft.position.set(-this.roadWidth * 0.5 - 12 - Math.random() * 8, 0, (Math.random() - 0.5) * length * 0.6);
      segGroup.add(bldLeft);

      const bHeight2 = 30 + Math.random() * 50;
      const bldRight = this.builder.buildBuilding(bHeight2, 12, 14, this.currentTrack);
      bldRight.position.set(this.roadWidth * 0.5 + 12 + Math.random() * 8, 0, (Math.random() - 0.5) * length * 0.6);
      segGroup.add(bldRight);
    }

    if (Math.random() > 0.7) {
      const texts = ['TOSHKENT', 'SAMARQAND', 'MALIBU TURBO', 'M-POWER', 'GENTRA SPORT', 'NITRO BOOST 3D'];
      const txt = texts[Math.floor(Math.random() * texts.length)];
      const bb = this.builder.buildBillboard(txt);
      const isLeft = Math.random() > 0.5;
      bb.position.set(isLeft ? -this.roadWidth * 0.5 - 5 : this.roadWidth * 0.5 + 5, 0, 0);
      bb.rotation.y = isLeft ? 0.3 : -0.3;
      segGroup.add(bb);
    }

    return segGroup;
  }

  setupGarageCar() {
    if (this.playerCar) {
      this.scene.remove(this.playerCar);
    }
    const carData = CAR_CATALOG[this.selectedCarIndex];
    this.playerCar = this.builder.buildCar(carData.id, this.selectedColor);
    this.playerCar.position.set(0, 0, 0);
    this.scene.add(this.playerCar);

    // Shield protective bubble mesh
    const shieldGeo = new THREE.SphereGeometry(2.8, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.visible = false;
    this.playerCar.add(this.shieldMesh);
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Keyboard handlers
    window.addEventListener('keydown', (e) => {
      window.soundEngine.ensureContext();
      if (e.repeat) return;
      this.handleKey(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.handleKey(e.code, false);
    });

    // UI Buttons
    document.getElementById('btn-play').addEventListener('click', () => this.startGame());
    document.getElementById('btn-restart').addEventListener('click', () => this.startGame());
    document.getElementById('btn-back-menu').addEventListener('click', () => this.toMenu());
    document.getElementById('btn-audio-toggle').addEventListener('click', () => {
      const muted = window.soundEngine.toggleMute();
      document.getElementById('btn-audio-toggle').innerHTML = muted ? '🔇' : '🔊';
    });

    // Camera Switch [C]
    document.getElementById('btn-cam').addEventListener('click', () => this.cycleCamera());

    // Garage Prev / Next
    document.getElementById('garage-prev').addEventListener('click', () => {
      this.selectedCarIndex = (this.selectedCarIndex - 1 + CAR_CATALOG.length) % CAR_CATALOG.length;
      this.onCarSelectChange();
    });
    document.getElementById('garage-next').addEventListener('click', () => {
      this.selectedCarIndex = (this.selectedCarIndex + 1) % CAR_CATALOG.length;
      this.onCarSelectChange();
    });

    // Color Swatches
    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        this.selectedColor = e.target.dataset.color;
        if (this.playerCar && this.playerCar.userData.bodyMat) {
          this.playerCar.userData.bodyMat.color.set(this.selectedColor);
        }
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
    });

    // Track Selection
    document.querySelectorAll('.track-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.track-btn').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        this.applyTrackAtmosphere(target.dataset.track);
      });
    });

    // Buy / Upgrade Buttons
    document.getElementById('btn-buy-car').addEventListener('click', () => this.buyCar());
    document.getElementById('btn-upgrade-engine').addEventListener('click', () => this.upgradeStat('engine'));
    document.getElementById('btn-upgrade-handling').addEventListener('click', () => this.upgradeStat('handling'));
    document.getElementById('btn-upgrade-nitro').addEventListener('click', () => this.upgradeStat('nitro'));

    // Mobile Onscreen Touch Controls
    this.setupTouchControls();
  }

  setupTouchControls() {
    const bindTouch = (id, keyName) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        window.soundEngine.ensureContext();
        this.keys[keyName] = true;
      });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.keys[keyName] = false;
      });
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        window.soundEngine.ensureContext();
        this.keys[keyName] = true;
      });
      el.addEventListener('mouseup', (e) => {
        e.preventDefault();
        this.keys[keyName] = false;
      });
    };

    bindTouch('touch-left', 'left');
    bindTouch('touch-right', 'right');
    bindTouch('touch-gas', 'up');
    bindTouch('touch-brake', 'down');
    bindTouch('touch-nitro', 'nitro');
    bindTouch('touch-drift', 'drift');

    const hornBtn = document.getElementById('touch-horn');
    if (hornBtn) {
      hornBtn.addEventListener('click', () => window.soundEngine.playHorn());
    }
  }

  handleKey(code, isDown) {
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = isDown;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = isDown;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = isDown;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = isDown;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.nitro = isDown;
    if (code === 'Space') this.keys.drift = isDown;

    if (isDown) {
      if (code === 'KeyC') this.cycleCamera();
      if (code === 'KeyH') window.soundEngine.playHorn();
      if (code === 'KeyP') this.togglePause();
    }
  }

  cycleCamera() {
    this.cameraMode = (this.cameraMode + 1) % 3;
    const names = ['3-SHAXS (CHASE)', 'KAPOT (HOOD)', 'YAQIN (CLOSE)'];
    this.showBanner(`🎥 KAMERA: ${names[this.cameraMode]}`);
  }

  onCarSelectChange() {
    this.setupGarageCar();
    this.updateGarageUI();
  }

  updateGarageUI() {
    const car = CAR_CATALOG[this.selectedCarIndex];
    const upg = this.getCarUpgrades(car.id);
    const isUnlocked = this.unlockedCars.includes(car.id);

    document.getElementById('car-title').innerText = car.name;
    document.getElementById('car-badge').innerText = car.badge;
    document.getElementById('car-desc').innerText = car.desc;

    // Stat bars
    const speedTotal = Math.min(100, (car.topSpeed + upg.engine * 15) / 4.4);
    const accelTotal = Math.min(100, (car.accel + upg.engine * 0.4) * 10);
    const handlTotal = Math.min(100, (car.handling + upg.handling * 0.4) * 10);
    const nitroTotal = Math.min(100, (car.nitro + upg.nitro * 0.4) * 10);

    document.getElementById('stat-speed-bar').style.width = `${speedTotal}%`;
    document.getElementById('stat-speed-val').innerText = `${car.topSpeed + upg.engine * 15} km/h`;

    document.getElementById('stat-accel-bar').style.width = `${accelTotal}%`;
    document.getElementById('stat-accel-val').innerText = `${((car.accel + upg.engine * 0.4) / 10).toFixed(1)}s`;

    document.getElementById('stat-handling-bar').style.width = `${handlTotal}%`;
    document.getElementById('stat-handling-val').innerText = `${handlTotal.toFixed(0)}%`;

    document.getElementById('stat-nitro-bar').style.width = `${nitroTotal}%`;
    document.getElementById('stat-nitro-val').innerText = `${nitroTotal.toFixed(0)}%`;

    // Buy or Select UI
    const buyBtn = document.getElementById('btn-buy-car');
    const playBtn = document.getElementById('btn-play');
    if (isUnlocked) {
      buyBtn.style.display = 'none';
      playBtn.style.display = 'block';
      playBtn.innerHTML = '⚡ POYGANI BOSHLASH';
    } else {
      buyBtn.style.display = 'block';
      playBtn.style.display = 'none';
      buyBtn.innerHTML = `🪙 SOTIB OLISH (${car.price} TANGA)`;
    }

    // Upgrades level info
    document.getElementById('upg-engine-lvl').innerText = `Bosqich: ${upg.engine}/5 (500 🪙)`;
    document.getElementById('upg-handling-lvl').innerText = `Bosqich: ${upg.handling}/5 (400 🪙)`;
    document.getElementById('upg-nitro-lvl').innerText = `Bosqich: ${upg.nitro}/5 (450 🪙)`;

    // Coins and Highscore display
    document.getElementById('menu-coins-count').innerText = this.totalCoins;
    document.getElementById('menu-best-score').innerText = this.highScore;
    document.getElementById('menu-best-dist').innerText = `${this.bestDist.toFixed(1)} km`;
  }

  buyCar() {
    const car = CAR_CATALOG[this.selectedCarIndex];
    if (this.totalCoins >= car.price) {
      this.totalCoins -= car.price;
      this.unlockedCars.push(car.id);
      this.saveUserData();
      this.updateGarageUI();
      window.soundEngine.playPowerupSound();
      this.showBanner(`🎉 TABRIKLAYMIZ! ${car.name} SOTIB OLINDI!`);
    } else {
      this.showBanner(`❌ Tangalar yetarli emas! Poygada yana tanga yiging.`);
    }
  }

  upgradeStat(type) {
    const car = CAR_CATALOG[this.selectedCarIndex];
    const upg = this.getCarUpgrades(car.id);
    const costs = { engine: 500, handling: 400, nitro: 450 };
    const cost = costs[type];

    if (upg[type] >= 5) {
      this.showBanner(`⚡ Ushbu xususiyat allaqachon maksimal darajada!`);
      return;
    }

    if (this.totalCoins >= cost) {
      this.totalCoins -= cost;
      upg[type]++;
      this.saveUserData();
      this.updateGarageUI();
      window.soundEngine.playPowerupSound();
      this.showBanner(`🔧 YAXSHILANDI! ${type.toUpperCase()} +1`);
    } else {
      this.showBanner(`❌ Tanga yetarli emas!`);
    }
  }

  startGame() {
    window.soundEngine.ensureContext();
    window.soundEngine.startEngine();
    window.soundEngine.startMusic();

    // Reset game stats
    this.state = 'PLAYING';
    this.speed = 0;
    this.rpm = 1000;
    this.gear = 1;
    this.score = 0;
    this.distance = 0;
    this.overtakes = 0;
    this.runCoins = 0;
    this.nitro = 100;
    this.playerX = 0;
    this.playerZ = 0;
    this.steerAngle = 0;
    this.driftAngle = 0;
    this.hasShield = false;
    this.magnetTimer = 0;

    // Clear dynamic entities
    this.clearEntities();

    // Hide Menus & Show HUD
    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');

    this.showBanner('🏁 GO! TEZLIKNI OSHIRING!');
  }

  clearEntities() {
    this.traffic.forEach(t => this.scene.remove(t.mesh));
    this.traffic = [];
    this.coins.forEach(c => this.scene.remove(c.mesh));
    this.coins = [];
    this.powerups.forEach(p => this.scene.remove(p.mesh));
    this.powerups = [];
    this.particles.forEach(pt => this.scene.remove(pt.mesh));
    this.particles = [];
  }

  toMenu() {
    this.state = 'MENU';
    window.soundEngine.stopEngine();
    window.soundEngine.stopMusic();

    document.getElementById('menu-overlay').classList.remove('hidden');
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById('game-hud').classList.add('hidden');

    this.clearEntities();
    this.setupGarageCar();
    this.updateGarageUI();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.showBanner('⏸️ PAUZA');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.showBanner('▶️ DAVOM ETISH');
    }
  }

  showBanner(msg) {
    const el = document.getElementById('action-banner');
    if (!el) return;
    el.innerText = msg;
    el.classList.add('visible');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      el.classList.remove('visible');
    }, 1800);
  }

  crash() {
    if (this.hasShield) {
      // Consume shield
      this.hasShield = false;
      this.shieldMesh.visible = false;
      window.soundEngine.playPowerupSound();
      this.showBanner('🛡️ QALQON ZARBADAN SAQLADI!');
      this.speed *= 0.5; // slight slow
      return;
    }

    this.state = 'CRASHED';
    window.soundEngine.playCrashSound();
    window.soundEngine.stopEngine();

    // Trigger visual screen shake & flash
    const overlay = document.getElementById('nitro-blur-fx');
    overlay.classList.add('crash-flash');
    setTimeout(() => overlay.classList.remove('crash-flash'), 600);

    // Save Highscore & Coins
    this.totalCoins += this.runCoins;
    if (this.score > this.highScore) this.highScore = this.score;
    if (this.distance > this.bestDist) this.bestDist = this.distance;
    this.saveUserData();

    // Show Game Over Modal
    setTimeout(() => {
      document.getElementById('game-hud').classList.add('hidden');
      const modal = document.getElementById('game-over-modal');
      modal.classList.remove('hidden');

      document.getElementById('go-score').innerText = this.score;
      document.getElementById('go-dist').innerText = `${this.distance.toFixed(1)} km`;
      document.getElementById('go-overtakes').innerText = this.overtakes;
      document.getElementById('go-coins').innerText = `+${this.runCoins} 🪙`;
      document.getElementById('go-best').innerText = this.highScore;
    }, 900);
  }

  updatePhysics(delta) {
    if (this.state !== 'PLAYING') return;

    const carData = CAR_CATALOG[this.selectedCarIndex];
    const upg = this.getCarUpgrades(carData.id);
    const maxTopSpeed = carData.topSpeed + upg.engine * 15;
    const accelRate = (carData.accel + upg.engine * 0.4) * 12;
    const steerSpeed = (carData.handling + upg.handling * 0.4) * 0.55;

    // Nitro handling
    if (this.keys.nitro && this.nitro > 0) {
      this.isNitro = true;
      this.nitro = Math.max(0, this.nitro - delta * 26);
      this.targetSpeed = maxTopSpeed * 1.25; // Super speed!
      this.createNitroFlames();
    } else {
      this.isNitro = false;
      this.nitro = Math.min(100, this.nitro + delta * 8); // regenerate
    }

    // Acceleration & Braking
    if (this.keys.up) {
      const topTarget = this.isNitro ? maxTopSpeed * 1.25 : maxTopSpeed;
      this.speed = Math.min(topTarget, this.speed + accelRate * delta * 2.8);
    } else if (this.keys.down) {
      // Brake & Reverse
      this.speed = Math.max(-40, this.speed - accelRate * delta * 5.0);
    } else {
      // Natural rolling friction
      this.speed *= Math.pow(0.985, delta * 60);
    }

    // Steering & Drift
    this.isDrifting = this.keys.drift && Math.abs(this.speed) > 40;
    const steerFactor = this.isDrifting ? 1.6 : 1.0;

    if (this.keys.left) {
      this.playerX -= steerSpeed * steerFactor * (this.speed / 120) * delta * 15;
      this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0.35, delta * 8);
      if (this.isDrifting) {
        this.driftAngle = THREE.MathUtils.lerp(this.driftAngle, 0.45, delta * 6);
        this.createSkidSmoke(-1);
        window.soundEngine.playDriftTire();
      }
    } else if (this.keys.right) {
      this.playerX += steerSpeed * steerFactor * (this.speed / 120) * delta * 15;
      this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, -0.35, delta * 8);
      if (this.isDrifting) {
        this.driftAngle = THREE.MathUtils.lerp(this.driftAngle, -0.45, delta * 6);
        this.createSkidSmoke(1);
        window.soundEngine.playDriftTire();
      }
    } else {
      this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0, delta * 10);
      this.driftAngle = THREE.MathUtils.lerp(this.driftAngle, 0, delta * 8);
    }

    // Road side boundary check
    if (this.playerX < -this.roadLimit) {
      this.playerX = -this.roadLimit;
      this.speed *= 0.96;
    }
    if (this.playerX > this.roadLimit) {
      this.playerX = this.roadLimit;
      this.speed *= 0.96;
    }

    // Calculate RPM & Gear
    this.gear = Math.min(7, Math.max(1, Math.floor(this.speed / (maxTopSpeed / 6)) + 1));
    const gearBaseSpeed = (this.gear - 1) * (maxTopSpeed / 6);
    const gearRatio = Math.max(0, (this.speed - gearBaseSpeed) / (maxTopSpeed / 6));
    this.rpm = THREE.MathUtils.lerp(this.rpm, 1200 + gearRatio * 7200, delta * 6);

    // Engine Audio update
    window.soundEngine.updateEngine(this.rpm, this.speed, this.keys.up, this.isNitro);

    // Distance & Score increment
    const metersTravelled = (this.speed / 3.6) * delta;
    this.distance += metersTravelled / 1000;
    this.score += Math.floor((this.speed * delta * 0.4) + (this.isNitro ? 5 : 1));

    // Update Car 3D Transform
    this.playerCar.position.x = this.playerX;
    this.playerCar.position.z = 0;
    this.playerCar.rotation.y = this.steerAngle * 0.4 + this.driftAngle * 0.6;
    this.playerCar.rotation.z = -this.steerAngle * 0.15; // roll
    this.playerCar.rotation.x = this.keys.up ? -0.02 : (this.keys.down ? 0.03 : 0);

    // Front wheels rotation
    if (this.playerCar.userData.frontWheels) {
      this.playerCar.userData.frontWheels.forEach(w => {
        w.rotation.y = this.steerAngle * 0.8;
      });
    }

    // Spin all wheels
    if (this.playerCar.userData.wheels) {
      this.playerCar.userData.wheels.forEach(w => {
        w.children[0].rotation.x += (this.speed / 3.6) * delta * 3;
      });
    }

    // Active powerup timers
    if (this.magnetTimer > 0) {
      this.magnetTimer -= delta;
      if (this.magnetTimer <= 0) this.showBanner('🧲 Magnit tugadi');
    }

    // Move Road Segments (Infinite scroller illusion)
    const moveDist = (this.speed / 3.6) * delta;
    this.roadSegments.forEach(seg => {
      seg.position.z -= moveDist;
      if (seg.position.z < -40) {
        seg.position.z += this.roadSegments.length * 40;
      }
    });

    // Spawning traffic, coins, powerups
    this.updateSpawners(delta, moveDist);

    // Check collisions
    this.updateCollisions();

    // Camera follow
    this.updateCamera(delta);

    // Update HUD
    this.updateHUD();
  }

  updateSpawners(delta, moveDist) {
    this.spawnTimer += delta;
    this.coinTimer += delta;

    // Traffic spawn rate scales with speed & distance
    const spawnInterval = Math.max(0.7, 2.2 - (this.distance * 0.08));
    if (this.spawnTimer > spawnInterval) {
      this.spawnTimer = 0;
      this.spawnTrafficCar();
    }

    // Spawn Coins & Powerups
    if (this.coinTimer > 1.4) {
      this.coinTimer = 0;
      this.spawnCoinsOrItem();
    }

    // Update Traffic positions
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      // Traffic drives forward relative to its own speed
      const tSpeedRel = (t.speed - this.speed) / 3.6;
      t.mesh.position.z += tSpeedRel * delta;

      // Check overtake score bonus
      if (!t.overtaken && t.mesh.position.z < -2.0) {
        t.overtaken = true;
        this.overtakes++;
        const nearMiss = Math.abs(t.mesh.position.x - this.playerX) < 2.8;
        if (nearMiss) {
          this.score += 250;
          this.runCoins += 5;
          window.soundEngine.playNearMissSound();
          this.showBanner('🔥 XAVFLI QUVIB O\'TISH! +250 BALL');
        } else {
          this.score += 80;
        }
      }

      // Remove offscreen
      if (t.mesh.position.z < -50 || t.mesh.position.z > 450) {
        this.scene.remove(t.mesh);
        this.traffic.splice(i, 1);
      }
    }

    // Update Coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.mesh.position.z -= moveDist;
      c.mesh.rotation.z += delta * 4;

      // Magnet attraction
      if (this.magnetTimer > 0) {
        const distToPlayer = Math.hypot(c.mesh.position.x - this.playerX, c.mesh.position.z);
        if (distToPlayer < 25) {
          c.mesh.position.x = THREE.MathUtils.lerp(c.mesh.position.x, this.playerX, delta * 12);
          c.mesh.position.z = THREE.MathUtils.lerp(c.mesh.position.z, 0, delta * 12);
        }
      }

      // Pickup
      if (Math.abs(c.mesh.position.z) < 2.0 && Math.abs(c.mesh.position.x - this.playerX) < 1.8) {
        window.soundEngine.playCoinSound();
        this.runCoins += 1;
        this.score += 20;
        this.scene.remove(c.mesh);
        this.coins.splice(i, 1);
        continue;
      }

      if (c.mesh.position.z < -30) {
        this.scene.remove(c.mesh);
        this.coins.splice(i, 1);
      }
    }

    // Update Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.mesh.position.z -= moveDist;
      p.mesh.rotation.y += delta * 3;

      if (Math.abs(p.mesh.position.z) < 2.2 && Math.abs(p.mesh.position.x - this.playerX) < 1.8) {
        window.soundEngine.playPowerupSound();
        if (p.type === 'nitro') {
          this.nitro = 100;
          this.showBanner('⚡ TO\'LIQ NITRO QUYILDI!');
        } else if (p.type === 'magnet') {
          this.magnetTimer = 12;
          this.showBanner('🧲 TANGA MAGNITI FAOL (12s)!');
        } else if (p.type === 'shield') {
          this.hasShield = true;
          this.shieldMesh.visible = true;
          this.showBanner('🛡️ QALQON HIMOYA BILAN TA\'MINLANDI!');
        }
        this.scene.remove(p.mesh);
        this.powerups.splice(i, 1);
        continue;
      }

      if (p.mesh.position.z < -30) {
        this.scene.remove(p.mesh);
        this.powerups.splice(i, 1);
      }
    }
  }

  spawnTrafficCar() {
    const lanes = [-5.5, -1.8, 1.8, 5.5];
    const laneX = lanes[Math.floor(Math.random() * lanes.length)];

    // Check if lane is already occupied nearby
    const occupied = this.traffic.some(t => Math.abs(t.mesh.position.x - laneX) < 1.2 && t.mesh.position.z > 180);
    if (occupied) return;

    const types = ['damas', 'sedan', 'taxi', 'truck'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const mesh = this.builder.buildTrafficCar(chosenType);

    // Spawn far ahead
    mesh.position.set(laneX, 0, 220 + Math.random() * 40);
    this.scene.add(mesh);

    // Assign realistic speed per vehicle
    let tSpeed = 80 + Math.random() * 60;
    if (chosenType === 'damas') tSpeed = 65 + Math.random() * 30;
    if (chosenType === 'truck') tSpeed = 70 + Math.random() * 25;
    if (chosenType === 'taxi') tSpeed = 95 + Math.random() * 50;

    this.traffic.push({
      mesh: mesh,
      type: chosenType,
      speed: tSpeed,
      width: mesh.userData.width || 2.0,
      length: mesh.userData.length || 4.2,
      overtaken: false
    });
  }

  spawnCoinsOrItem() {
    const lanes = [-5.5, -1.8, 1.8, 5.5];
    const laneX = lanes[Math.floor(Math.random() * lanes.length)];
    const spawnZ = 200 + Math.random() * 30;

    // 85% coins pattern, 15% special powerup
    if (Math.random() < 0.85) {
      // Line of 3 coins
      for (let i = 0; i < 3; i++) {
        const coinMesh = this.builder.buildCoin();
        coinMesh.position.set(laneX, 0.9, spawnZ + i * 4);
        this.scene.add(coinMesh);
        this.coins.push({ mesh: coinMesh });
      }
    } else {
      const pTypes = ['nitro', 'magnet', 'shield'];
      const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
      let pMesh;
      if (pType === 'nitro') pMesh = this.builder.buildNitroCanister();
      else if (pType === 'magnet') pMesh = this.builder.buildMagnet();
      else pMesh = this.builder.buildShield();

      pMesh.position.set(laneX, 1.0, spawnZ);
      this.scene.add(pMesh);
      this.powerups.push({ mesh: pMesh, type: pType });
    }
  }

  updateCollisions() {
    const pBounds = {
      minX: this.playerX - 1.0,
      maxX: this.playerX + 1.0,
      minZ: -2.2,
      maxZ: 2.2
    };

    for (const t of this.traffic) {
      const hw = t.width * 0.48;
      const hl = t.length * 0.48;
      const tBounds = {
        minX: t.mesh.position.x - hw,
        maxX: t.mesh.position.x + hw,
        minZ: t.mesh.position.z - hl,
        maxZ: t.mesh.position.z + hl
      };

      const overlapX = pBounds.minX < tBounds.maxX && pBounds.maxX > tBounds.minX;
      const overlapZ = pBounds.minZ < tBounds.maxZ && pBounds.maxZ > tBounds.minZ;

      if (overlapX && overlapZ) {
        this.crash();
        break;
      }
    }
  }

  createSkidSmoke(dir) {
    if (Math.random() > 0.4) return;
    const smokeGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.5
    });
    const smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.set(this.playerX + (dir * 0.8), 0.25, -2.0);
    this.scene.add(smoke);
    this.particles.push({ mesh: smoke, life: 0.5, maxLife: 0.5 });
  }

  createNitroFlames() {
    const flameGeo = new THREE.ConeGeometry(0.2, 1.0, 6);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.rotation.x = Math.PI / 2;
    flame.position.set(this.playerX + (Math.random() - 0.5) * 0.3, 0.22, -2.5 - Math.random() * 0.5);
    this.scene.add(flame);
    this.flameParticles.push({ mesh: flame, life: 0.15 });
  }

  updateCamera(delta) {
    if (this.cameraMode === 0) {
      // Dynamic Chase Camera (behind)
      const targetCamX = this.playerX * 0.7;
      const targetCamY = 3.6 + (this.speed / 300) * 0.5;
      const targetCamZ = -7.5 - (this.speed / 280) * 1.5;

      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, delta * 10);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, delta * 8);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, delta * 12);
      this.camera.lookAt(this.playerX * 0.4, 1.2, 12);
    } else if (this.cameraMode === 1) {
      // Hood Camera
      this.camera.position.set(this.playerX, 1.2, 1.0);
      this.camera.lookAt(this.playerX + this.steerAngle * 4, 1.0, 30);
    } else {
      // Close Behind Camera
      this.camera.position.set(this.playerX * 0.85, 2.2, -4.5);
      this.camera.lookAt(this.playerX, 1.1, 10);
    }

    // Dynamic FOV on Nitro
    const targetFov = this.isNitro ? 82 : 65;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 8);
    this.camera.updateProjectionMatrix();
  }

  updateHUD() {
    // Speedometer
    const spdVal = Math.max(0, Math.round(this.speed));
    document.getElementById('hud-speed-num').innerText = spdVal;
    document.getElementById('hud-gear-num').innerText = this.gear;

    // Tachometer needle
    const maxRpm = 8500;
    const rpmAngle = -110 + (this.rpm / maxRpm) * 220; // -110 to +110 deg
    const needle = document.getElementById('tach-needle');
    if (needle) needle.style.transform = `rotate(${rpmAngle}deg)`;

    // Digital stats
    document.getElementById('hud-score-val').innerText = this.score;
    document.getElementById('hud-dist-val').innerText = `${this.distance.toFixed(1)} km`;
    document.getElementById('hud-coins-val').innerText = this.runCoins;
    document.getElementById('hud-overtake-val').innerText = this.overtakes;

    // Nitro Bar
    const nitroFill = document.getElementById('hud-nitro-fill');
    if (nitroFill) {
      nitroFill.style.width = `${this.nitro}%`;
      document.getElementById('hud-nitro-text').innerText = `${Math.round(this.nitro)}%`;
    }

    // Nitro Blur overlay
    const blurFx = document.getElementById('nitro-blur-fx');
    if (this.isNitro) blurFx.classList.add('active');
    else blurFx.classList.remove('active');
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.state === 'PLAYING') {
      this.updatePhysics(delta);
    } else if (this.state === 'MENU') {
      // Rotating showcase in garage
      if (this.playerCar) {
        this.playerCar.rotation.y += delta * 0.6;
        this.playerCar.position.set(0, 0, 0);
      }
      this.camera.position.set(0, 2.8, -6.5);
      this.camera.lookAt(0, 0.8, 0);
    }

    // Particles life update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      p.mesh.position.y += delta * 0.8;
      p.mesh.scale.multiplyScalar(1 + delta * 1.5);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.flameParticles.length - 1; i >= 0; i--) {
      const f = this.flameParticles[i];
      f.life -= delta;
      if (f.life <= 0) {
        this.scene.remove(f.mesh);
        this.flameParticles.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Bootstrap once DOM loads
window.addEventListener('DOMContentLoaded', () => {
  window.racingGame = new RacingGame();
});
