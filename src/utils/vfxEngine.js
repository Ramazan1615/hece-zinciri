/**
 * Hece Zinciri PRO - 60 FPS HTML5 Canvas Görsel Efekt (VFX) ve Fizik Motoru
 *
 * İçerdiği Stüdyo Efektleri:
 * 1. Shockwave Rings: Patlama merkezinden yayılan neon ışık halkaları
 * 2. Lightning Arcs: Patlayan kelimenin hecelerini birbirine bağlayan elektrik/şimşek çakmaları
 * 3. Homing Score Orbs: Patlayan hücrelerden kavisli Bezier yörüngesiyle üstteki SKOR kutusuna uçan enerji küreleri
 * 4. Gravity Sparks & Star Confetti: Yerçekimli, dönen yıldız parçacıkları, kıvılcım izleri ve 3D taş kırıkları
 * 5. Comet Drag Trail: Taşı sürüklerken parmağın arkasından akan sihirli yıldız tozu kuyruğu
 * 6. Screen Flash: Büyük kombolarda sinematik ekran parlaması
 */

export class CanvasVfxManager {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.lightnings = [];
    this.homingOrbs = [];
    this.trailPoints = [];
    this.screenFlash = 0;
    this.screenFlashColor = '#fbbf24';
    this.onWake = null;
  }

  hasActiveEffects() {
    return (
      this.particles.length > 0 ||
      this.shockwaves.length > 0 ||
      this.lightnings.length > 0 ||
      this.homingOrbs.length > 0 ||
      this.trailPoints.length > 0 ||
      this.screenFlash > 0.005
    );
  }

  wake() {
    if (typeof this.onWake === 'function') {
      this.onWake();
    }
  }

  /**
   * Sürükleme esnasında parmağın/taşın arkasından akan kuyruk yıldızları
   */
  spawnDragTrail(x, y, color = '#38bdf8') {
    this.trailPoints.push({ x, y, life: 1.0, color });
    if (this.trailPoints.length > 18) {
      this.trailPoints.shift();
    }

    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.2;
      this.particles.push({
        type: 'star',
        x: x + (Math.random() - 0.5) * 22,
        y: y + (Math.random() - 0.5) * 22,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        gravity: 0.04,
        drag: 0.96,
        size: 3 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        color: Math.random() < 0.5 ? '#fde047' : color,
        alpha: 0.95,
        decay: 0.035 + Math.random() * 0.02
      });
    }
    this.wake();
  }

  clearDragTrail() {
    this.trailPoints = [];
    this.wake();
  }

  /**
   * Taş konulduğunda hafif toz ve dalga halkası
   */
  spawnPlaceEffect(x, y, color = '#38bdf8') {
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius: 52,
      lineWidth: 4,
      color,
      alpha: 0.85,
      speed: 3.2
    });

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3;
      const speed = 1.8 + Math.random() * 3.5;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.08,
        drag: 0.94,
        size: 2.5 + Math.random() * 3,
        color,
        alpha: 1,
        decay: 0.04
      });
    }
    this.wake();
  }

  /**
   * Kelime Patlaması Şöleni:
   * - Her hücrede çift katmanlı neon şok dalgası
   * - Hücreler arasında çakan şimşek (Lightning Arc)
   * - 35+ dönen yıldız, kıvılcım ve parlak konfeti
   * - Skor sayacına uçan Homing Enerji Küreleri (çarptığında onOrbArrive callback tetiklenir)
   */
  spawnWordBlastVfx(cellScreenPoints, scoreTargetPoint, comboMultiplier = 1, onOrbArrive = null) {
    const PALETTE = ['#fde047', '#38bdf8', '#34d399', '#fb7185', '#c084fc', '#ffffff'];

    // Ekran flaşı
    this.screenFlash = Math.min(0.45, 0.14 + comboMultiplier * 0.06);
    this.screenFlashColor = comboMultiplier >= 2 ? '#f59e0b' : '#34d399';

    // 1. Hücreler arası elektrik / şimşek bağı
    if (cellScreenPoints.length >= 2) {
      for (let i = 0; i < cellScreenPoints.length - 1; i++) {
        this.lightnings.push({
          x1: cellScreenPoints[i].x,
          y1: cellScreenPoints[i].y,
          x2: cellScreenPoints[i + 1].x,
          y2: cellScreenPoints[i + 1].y,
          color: comboMultiplier >= 2 ? '#fde047' : '#38bdf8',
          life: 1.0,
          decay: 0.045
        });
      }
    }

    // 2. Her patlayan hücre için Şok Dalgaları, Yıldızlar, Kıvılcımlar ve Skor Küreleri
    cellScreenPoints.forEach((pt, idx) => {
      const mainColor = PALETTE[(idx + comboMultiplier) % PALETTE.length];

      // Dış hızlı şok dalgası
      this.shockwaves.push({
        x: pt.x,
        y: pt.y,
        radius: 8,
        maxRadius: 95 + comboMultiplier * 15,
        lineWidth: 7,
        color: mainColor,
        alpha: 1,
        speed: 5.5
      });

      // İç beyaz parlak halka
      this.shockwaves.push({
        x: pt.x,
        y: pt.y,
        radius: 4,
        maxRadius: 60,
        lineWidth: 4,
        color: '#ffffff',
        alpha: 0.9,
        speed: 3.8
      });

      // Patlama parçacıkları (Yıldızlar + Kıvılcım Çizgileri)
      const count = 24 + Math.min(24, comboMultiplier * 6);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 2.5 + Math.random() * (7.5 + comboMultiplier * 1.2);
        const isStar = i % 3 === 0;

        this.particles.push({
          type: isStar ? 'star' : i % 2 === 0 ? 'streak' : 'spark',
          x: pt.x,
          y: pt.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.4,
          gravity: isStar ? 0.16 : 0.12,
          drag: 0.95,
          size: isStar ? 5 + Math.random() * 5 : 3 + Math.random() * 4,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.28,
          color: PALETTE[i % PALETTE.length],
          alpha: 1,
          decay: 0.016 + Math.random() * 0.015
        });
      }

      // Skor kutusuna uçan Homing Enerji Küreleri (Her hücreden 3 adet)
      if (scoreTargetPoint) {
        for (let o = 0; o < 3; o++) {
          const spreadX = pt.x + (Math.random() - 0.5) * 90;
          const spreadY = pt.y + (Math.random() - 0.5) * 70;
          this.homingOrbs.push({
            startX: pt.x,
            startY: pt.y,
            ctrlX: spreadX,
            ctrlY: spreadY,
            targetX: scoreTargetPoint.x,
            targetY: scoreTargetPoint.y,
            t: -o * 0.08, // Sıralı kalkış gecikmesi
            speed: 0.032 + Math.random() * 0.01,
            color: o === 0 ? '#fde047' : mainColor,
            size: 6 + (o === 0 ? 2 : 0),
            trail: [],
            onArrive: o === 0 ? onOrbArrive : null
          });
        }
      }
    });
    this.wake();
  }

  /**
   * Gökten düşen Şimşek / Bomba Mega Patlama Efekti
   */
  spawnMegaLightningStrike(targetX, targetY) {
    this.screenFlash = 0.5;
    this.screenFlashColor = '#38bdf8';

    this.lightnings.push({
      x1: targetX + (Math.random() - 0.5) * 80,
      y1: 0,
      x2: targetX,
      y2: targetY,
      color: '#fde047',
      life: 1.0,
      decay: 0.035
    });

    this.shockwaves.push({
      x: targetX,
      y: targetY,
      radius: 12,
      maxRadius: 150,
      lineWidth: 10,
      color: '#fde047',
      alpha: 1,
      speed: 7.5
    });
    this.wake();
  }

  /**
   * ❄️ Buzlu Hücre Kırılma Görsel Efekti
   */
  spawnIceShatterVfx(x, y) {
    const ICE_COLORS = ['#e0f2fe', '#7dd3fc', '#38bdf8', '#ffffff'];
    this.shockwaves.push({
      x,
      y,
      radius: 6,
      maxRadius: 72,
      lineWidth: 5,
      color: '#7dd3fc',
      alpha: 0.95,
      speed: 4.5
    });

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.35;
      const speed = 2.2 + Math.random() * 6.2;
      this.particles.push({
        type: i % 2 === 0 ? 'star' : 'streak',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        gravity: 0.18,
        drag: 0.95,
        size: 4 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.35,
        color: ICE_COLORS[i % ICE_COLORS.length],
        alpha: 1,
        decay: 0.02 + Math.random() * 0.015
      });
    }
    this.wake();
  }

  /**
   * 🎉 Bölüm Zaferi Tam Ekran Konfeti & Yıldız Yağmuru
   */
  spawnVictoryConfetti(width = 400, height = 700) {
    const COLORS = ['#fde047', '#38bdf8', '#34d399', '#fb7185', '#c084fc', '#f97316'];
    this.screenFlash = 0.35;
    this.screenFlashColor = '#fde047';

    for (let i = 0; i < 85; i++) {
      const fromLeft = i % 2 === 0;
      const startX = fromLeft ? width * 0.15 : width * 0.85;
      const startY = height * 0.55;
      const angle = fromLeft
        ? -Math.PI * 0.42 + (Math.random() - 0.5) * 0.65
        : -Math.PI * 0.58 + (Math.random() - 0.5) * 0.65;
      const speed = 6 + Math.random() * 11;

      this.particles.push({
        type: i % 2 === 0 ? 'star' : 'spark',
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.14,
        drag: 0.97,
        size: 5 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        color: COLORS[i % COLORS.length],
        alpha: 1,
        decay: 0.009 + Math.random() * 0.008
      });
    }
    this.wake();
  }

  /**
   * 60 FPS Kare Güncelleme & Çizim
   */
  updateAndDraw(ctx, width, height) {
    if (!ctx || !width || !height) return;
    try {
      ctx.clearRect(0, 0, width, height);

    // 1. Ekran Flaşı
    if (this.screenFlash > 0.005) {
      ctx.save();
      ctx.fillStyle = this.screenFlashColor;
      ctx.globalAlpha = this.screenFlash;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      this.screenFlash *= 0.86;
    } else {
      this.screenFlash = 0;
    }

    // 2. Sürükleme Kuyruğu (Comet Ribbon)
    if (this.trailPoints.length > 1) {
      ctx.save();
      for (let i = 0; i < this.trailPoints.length - 1; i++) {
        const p1 = this.trailPoints[i];
        const p2 = this.trailPoints[i + 1];
        p1.life -= 0.06;
        if (p1.life <= 0) continue;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = p1.color;
        ctx.globalAlpha = Math.max(0, p1.life * 0.65);
        ctx.lineWidth = (i / this.trailPoints.length) * 16;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      this.trailPoints = this.trailPoints.filter((p) => p.life > 0);
      ctx.restore();
    }

    // 3. Şok Dalgaları (Shockwave Rings)
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      const progress = sw.radius / sw.maxRadius;
      sw.alpha = Math.max(0, 1 - progress);

      if (sw.alpha <= 0.01 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = Math.max(1, sw.lineWidth * (1 - progress * 0.7));
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Hücreler Arası Şimşek Çakmaları (Lightning Arcs)
    for (let i = this.lightnings.length - 1; i >= 0; i--) {
      const lt = this.lightnings[i];
      lt.life -= lt.decay;
      if (lt.life <= 0) {
        this.lightnings.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      const segments = 7;
      ctx.moveTo(lt.x1, lt.y1);
      for (let s = 1; s < segments; s++) {
        const frac = s / segments;
        const nx = lt.x1 + (lt.x2 - lt.x1) * frac + (Math.random() - 0.5) * 24;
        const ny = lt.y1 + (lt.y2 - lt.y1) * frac + (Math.random() - 0.5) * 24;
        ctx.lineTo(nx, ny);
      }
      ctx.lineTo(lt.x2, lt.y2);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.globalAlpha = lt.life;
      ctx.shadowColor = lt.color;
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Parçacıklar (Yıldızlar, Kıvılcım Çizgileri ve Parlak Küreler)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.rotation !== undefined) {
        p.rotation += p.vRot || 0;
      }

      if (p.alpha <= 0.01) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.type === 'star') {
        this.drawStar(ctx, p.x, p.y, 5, p.size, p.size * 0.45, p.rotation);
      } else if (p.type === 'streak') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2.6, p.y - p.vy * 2.6);
        ctx.lineWidth = p.size * 0.7;
        ctx.lineCap = 'round';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 6. Skor Kutusuna Uçan Homing Enerji Küreleri (Quadratic Bezier)
    for (let i = this.homingOrbs.length - 1; i >= 0; i--) {
      const orb = this.homingOrbs[i];
      orb.t += orb.speed;
      if (orb.t < 0) continue;

      if (orb.t >= 1) {
        if (typeof orb.onArrive === 'function') {
          orb.onArrive();
        }
        // Hedefe çarptığında küçük bir halka oluştur
        this.shockwaves.push({
          x: orb.targetX,
          y: orb.targetY,
          radius: 4,
          maxRadius: 28,
          lineWidth: 3,
          color: orb.color,
          alpha: 0.9,
          speed: 2.8
        });
        this.homingOrbs.splice(i, 1);
        continue;
      }

      const inv = 1 - orb.t;
      const curX =
        inv * inv * orb.startX + 2 * inv * orb.t * orb.ctrlX + orb.t * orb.t * orb.targetX;
      const curY =
        inv * inv * orb.startY + 2 * inv * orb.t * orb.ctrlY + orb.t * orb.t * orb.targetY;

      orb.trail.push({ x: curX, y: curY });
      if (orb.trail.length > 7) orb.trail.shift();

      ctx.save();
      // Küre izi
      for (let tIdx = 0; tIdx < orb.trail.length; tIdx++) {
        const tp = orb.trail[tIdx];
        const ratio = (tIdx + 1) / orb.trail.length;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, orb.size * ratio * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = orb.color;
        ctx.globalAlpha = ratio * 0.55;
        ctx.fill();
      }

      // Ana parlak enerji küresi
      ctx.beginPath();
      ctx.arc(curX, curY, orb.size, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = orb.color;
      ctx.shadowBlur = 16;
      ctx.globalAlpha = 1;
      ctx.fill();
      ctx.restore();
    }
    } catch {
      // ignore canvas errors
    }
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, rotation = 0) {
    let rot = (Math.PI / 2) * 3 + rotation;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }
}

export const vfxManager = new CanvasVfxManager();
