import {
  linearInterpolation,
  hyperbolicInterpolation,
  randomInRange,
} from "./util.js?v=7";

// general arch spirals
// r = a + b * Math.pow(theta, 1/c)
// theta = Math.pow((r - a)/b, c)
// theta === angle(radians)
// b === distance between each loop
// Archimedean spiral (c === 1)
// Hyperbolic spiral (c === -1)
// Fermat's spiral (c === 1/2)
// Logarithmic spiral
// r = b * Math.exp(c * theta)

// x = r * Math.cos(theta)
// y = r * Math.sin(theta)

const DEFAULT_SPIRAL_OPTIONS = {
  spiralC: 1.25,
  particleSizeRatio: 1 / 40,
  baseFrameCount: 3000,
  clockwise: false,
  randomCenter: {
    xFactor: 1,
    yFactor: 1,
  },
};
function Spiral(rect, options = {}) {
  const _options = { ...DEFAULT_SPIRAL_OPTIONS, ...options };
  let bDivisor = 50;
  let particleSizeRandomFactor = Math.random() + 1;

  const aspectRatio =
    Math.max(rect.width, rect.height) / Math.min(rect.width, rect.height);

  let _centerOffset = { x: 0, y: 0 };
  let _center = { x: 0, y: 0 };
  let particleSizeMultipler =
    particleSizeRandomFactor * _options.particleSizeRatio;
  let seedRotateSpeedMultiplier = 1;
  this.a = 0;
  this.b = 0;
  this.c = _options.spiralC;
  this.maxRadialDistance = 0;
  this.maxTheta = 0;
  this.inverseMaxTheta = 0;
  this.seedRotateSpeed = 0;
  this.seedMaxParticleSize = 0;
  this.spiralType = _options.spiralType;
  this.initialAspectRatio = aspectRatio;
  let _clockwise = 1;
  _clockwise = _options.clockwise ? -1 : 1;

  this.setRotateSpeedMultiplier = (multiplier) => {
    seedRotateSpeedMultiplier = multiplier;
    this.seedRotateSpeed = this.baseSeedRotateSpeed();
  };

  this.baseSeedRotateSpeed = () =>
    (seedRotateSpeedMultiplier * this.maxTheta) / _options.baseFrameCount;

  this.centerOffset = () => _centerOffset;
  this.center = () => {
    return {
      x: _center.x + _centerOffset.x,
      y: _center.y + _centerOffset.y,
    };
  };
  this.setCenter = ({ x = 0, y = 0 }) => {
    _center.x = x;
    _center.y = y;
    this.nearestDeviceEdge = Math.min(
      _center.x,
      _center.y,
      this.rect.width - _center.x,
      this.rect.height - _center.y
    );
  };
  this.setCenterOffset = ({ x = 0, y = 0 }) => {
    _centerOffset.x = x;
    _centerOffset.y = y;
  };

  this.adjustedC = (theta) => {
    if (theta <= 0) {
      return this.c;
    }
    return 1 / this.c;
  };

  this.getRadialDistance = (theta = 0, bFactor = 1) => {
    let _theta = Math.abs(theta);
    if (_theta === 0) {
      return this.a;
    }
    return this.a + bFactor * this.b * Math.pow(_theta, this.adjustedC(theta));
  };

  this.getTheta = (radialDistance, bFactor = 1, inverse = false) => {
    if (radialDistance === this.a) {
      return 0;
    }
    let power = this.c;
    if (inverse) {
      power = 1 / this.c;
    }
    return Math.pow(
      Math.abs((radialDistance - this.a) / (bFactor * this.b)),
      power
    );
  };

  this.getCoordinates = (radialDistance, theta, thetaOffset = 0) => {
    let { x, y } = this.center();
    let _theta = theta;
    const xLength = radialDistance * Math.cos(Math.abs(theta) + thetaOffset);
    const yLength = radialDistance * Math.sin(Math.abs(theta) + thetaOffset);
    if (_theta < 0) {
      x -= xLength * _clockwise;
      y -= yLength;
    } else {
      x += xLength * _clockwise;
      y += yLength;
    }
    return {
      x,
      y,
    };
  };
  this.calculateParticleSize = ({ radialDistance, theta, bFactor }) => {
    let _maxTheta = this.maxTheta;
    let _theta = theta;
    if (theta === undefined) {
      _theta = this.getTheta(radialDistance, bFactor);
    }
    if (bFactor !== undefined) {
      if (_theta < 0) {
        _maxTheta = this.inverseMaxTheta / Math.pow(bFactor, 1 / this.c);
      } else {
        _maxTheta = this.maxTheta / Math.pow(bFactor, this.c);
      }
    }
    let particleSize = linearInterpolation(
      Math.abs(_theta),
      { min: 0, max: Math.abs(_maxTheta) },
      { min: 1, max: this.seedMaxParticleSize }
    );
    return particleSize;
  };

  this.setMaxRadialDistance = (maxRadialDistance) => {
    this.maxRadialDistance = Math.max(maxRadialDistance, 1);
    this.b = this.maxRadialDistance / Math.pow(bDivisor, 1 / this.c);
    this.seedMaxParticleSize = this.maxRadialDistance * particleSizeMultipler;
    this.maxTheta = this.getTheta(this.maxRadialDistance);
    this.inverseMaxTheta = this.getTheta(this.maxRadialDistance, 1, true);
    this.seedRotateSpeed = this.baseSeedRotateSpeed();
  };

  this.setSize = (rect) => {
    this.rect = rect;
    this.setCenter({
      x: (rect.width / 2) * options.randomCenter.xFactor,
      y: (rect.height / 2) * options.randomCenter.yFactor,
    });
    const maxRadialDistance =
      Math.sqrt(Math.pow(rect.width, 2) + Math.pow(rect.height, 2)) / 2;
    this.setMaxRadialDistance(maxRadialDistance);
  };
  this.setSize(rect);
}

function KillZone({
  killColor,
  maxKillRadius,
  center,
  kill,
  calculateParticleSize,
  killValue,
}) {
  let isKill = false;
  this.radiusWhenKill = 0;
  let currentValue = 0;
  let growRadius = 0;
  let currentRadius = 0;
  let randomKillFactor = Math.random();
  let _center = center;
  let _centerOffset = { x: 0, y: 0 };
  const killRadiusFactor = randomInRange(0.75, 0.95);
  let _killRadius = Math.max(maxKillRadius * killRadiusFactor, 1);

  this.setCenter = (center) => {
    _center = center;
  };
  this.centerOffset = () => _centerOffset;
  this.setCenterOffset = (offset) => {
    if (Math.abs(offset.x) > 0.2 * _killRadius) {
      if (offset.x > 0) {
        _centerOffset.x -= 1;
      } else {
        _centerOffset.x += 1;
      }
    } else {
      _centerOffset.x = offset.x;
    }
    if (Math.abs(offset.y) > 0.2 * _killRadius) {
      if (offset.y > 0) {
        _centerOffset.y -= 1;
      } else {
        _centerOffset.y += 1;
      }
    } else {
      _centerOffset.y = offset.y;
    }
  };
  this.center = () => {
    return {
      x: _center.x + _centerOffset.x,
      y: _center.y + _centerOffset.y,
    };
  };

  this.updateMaxKillRadius = (maxKillRadius) => {
    _killRadius = maxKillRadius * killRadiusFactor;
    if (isKill) {
      currentRadius = _killRadius;
      growRadius = _killRadius;
    } else {
      growRadius = this.growRadius();
    }
  };

  this.addValue = (value) => {
    if (isKill) return;
    currentValue += value;
    growRadius = this.growRadius();
    if (currentValue > killValue) {
      kill?.();
      isKill = true;
      this.radiusWhenKill = currentRadius;
    }
  };
  this.distanceFromCenter = ({ x, y }) =>
    Math.sqrt(
      Math.pow(x - this.center().x, 2) + Math.pow(y - this.center().y, 2)
    );
  this.killRadius = () => _killRadius;
  this.killArea = () => Math.PI * Math.pow(_killRadius, 2);
  this.growRadius = () =>
    Math.min(
      Math.sqrt(((currentValue / killValue) * this.killArea()) / Math.PI),
      _killRadius
    );

  this.currentRadius = () => currentRadius;
  this.draw = (ctx) => {
    if (currentRadius < 0) return;
    if (growRadius > currentRadius && !isKill) {
      const radiusDelta = growRadius - currentRadius;
      currentRadius += Math.min(radiusDelta / 10, 0.5);
    } else {
      currentRadius = growRadius;
    }

    const lineWidth = Math.max(2, calculateParticleSize(currentRadius));
    if (currentRadius <= lineWidth) return;
    const center = this.center();
    const alpha = linearInterpolation(
      currentRadius,
      { min: 0, max: this.killRadius() },
      { min: 0.2, max: 0.7 }
    );

    ctx.beginPath();
    ctx.fillStyle = `rgba(0,0,0, 1)`;
    ctx.arc(center.x, center.y, currentRadius + lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(center.x, center.y, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${killColor.join(",")}, ${alpha})`;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  };
}

const drawParticleCircle = (ctx, { coordinates, particleSize, colorStyle }) => {
  ctx.beginPath();
  ctx.fillStyle = colorStyle;
  ctx.arc(coordinates.x, coordinates.y, particleSize / 2, 0, Math.PI * 2);
  ctx.fill();
};
const drawParticleStroke = ({
  ctx,
  lastCoordinates,
  coordinates,
  particleSize,
  colorStyle,
}) => {
  ctx.beginPath();
  ctx.strokeStyle = colorStyle;
  ctx.lineWidth = particleSize;
  ctx.moveTo(lastCoordinates.x, lastCoordinates.y);
  ctx.lineTo(coordinates.x, coordinates.y);
  ctx.stroke();
};

function Particle({ ctx, value = 0, options = {} }) {
  this.value = value;
  this.particleType = options?.particleType ?? "circle";
  this.lastCoordinates = { x: 0, y: 0 };
  this.scaleFactor = options?.scaleFactor ?? 1;

  const colorTuple = options?.colorTuple ?? [40, 40, 40];
  const _joinedColorTuple = colorTuple.join(",");
  const finalOpacity = this.particleType === "circle" ? 0.7 : 0.5;
  let alpha = options.initialAlpha ?? 0;
  const stepAlpha = () => {
    alpha += 0.05;
    if (alpha > 1) {
      alpha = 1;
    }
  };
  const colorStyle = () =>
    `rgba(${_joinedColorTuple}, ${finalOpacity * alpha})`;

  const state = {
    radialDistance: options.initialRadialDistance ?? Infinity,
    theta: undefined,
    thetaOffset: options.thetaOffset ?? randomInRange(0, Math.PI * 2),
    bFactor: options.bFactor ?? randomInRange(0.5, 1),
  };

  this.theta = () => state.theta;
  this.radialDistance = () => state.radialDistance;
  this.clone = ({ initialRadialDistance, initialAlpha, scaleFactor }) => {
    const particle = new Particle({
      ctx,
      value,
      options: {
        colorTuple,
        particleType: this.particleType,
        thetaOffset: state.thetaOffset,
        bFactor: state.bFactor,
        initialRadialDistance,
        initialAlpha,
        scaleFactor: scaleFactor ?? this.scaleFactor,
      },
    });
    return particle;
  };

  const draw =
    this.particleType === "circle" ? drawParticleCircle : drawParticleStroke;
  this.rotate = (spiral, rotateSpeedMultipler = 1, paused = false) => {
    stepAlpha();
    if (state.radialDistance === Infinity) {
      state.radialDistance = spiral.maxRadialDistance;
    }
    if (state.theta === undefined) {
      state.theta = spiral.getTheta(state.radialDistance, state.bFactor);
      this.lastCoordinates = spiral.getCoordinates(
        state.radialDistance,
        state.theta,
        state.thetaOffset
      );
    }

    const rotateSpeed =
      (spiral.seedRotateSpeed / this.scaleFactor) * rotateSpeedMultipler;
    if (Math.abs(state.theta) < rotateSpeed && state.theta !== 0) {
      state.theta = 0;
    } else {
      state.theta -= rotateSpeed;
      if (state.theta < 0) {
        state.theta -= rotateSpeed;
      }
    }
    state.radialDistance = spiral.getRadialDistance(state.theta, state.bFactor);

    const absRadialDistance = Math.abs(state.radialDistance);
    let particleSize =
      spiral.calculateParticleSize({
        theta: state.theta,
        bFactor: state.bFactor,
      }) * this.scaleFactor;

    const coordinates = spiral.getCoordinates(
      state.radialDistance,
      state.theta,
      state.thetaOffset
    );
    if (
      absRadialDistance > 1.3 * spiral.maxRadialDistance &&
      (coordinates.x < 0 ||
        coordinates.y < 0 ||
        coordinates.x > ctx.canvas.width ||
        coordinates.y > ctx.canvas.height)
    ) {
      return true;
    }
    if (paused === false) {
      draw(ctx, {
        lastCoordinates: this.lastCoordinates,
        coordinates,
        particleSize,
        colorStyle: colorStyle(),
      });
    }
    this.lastCoordinates = coordinates;
    return false;
  };
}

export default function ParticleBlackHole({
  canvasId,
  onDone,
  jackpot = 10000,
  killColorTuple,
  mainSpiralOptions = DEFAULT_SPIRAL_OPTIONS,
  killStageSpiralOptions = DEFAULT_SPIRAL_OPTIONS,
  centerSpiralOptions = DEFAULT_SPIRAL_OPTIONS,
  trailLength = 3,
}) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  let isKill = false;
  function kill() {
    isKill = true;
  }

  ctx.globalAlpha = 1;

  const spiral = new Spiral(
    { height: canvas.height, width: canvas.width },
    mainSpiralOptions
  );
  const killStageSpiral = new Spiral(
    { height: canvas.height, width: canvas.width },
    killStageSpiralOptions
  );
  const centerSpiral = new Spiral(
    { height: canvas.height, width: canvas.width },
    centerSpiralOptions
  );
  let maxRadialDistance = spiral.maxRadialDistance;
  let killZone = new KillZone({
    center: spiral.center(),
    maxKillRadius: spiral.maxRadialDistance / 2,
    killColor: killColorTuple,
    kill,
    calculateParticleSize: (radialDistance) =>
      spiral.calculateParticleSize({ radialDistance }),
    killValue: jackpot,
  });

  console.log({
    spiral,
    killStageSpiral,
    centerSpiral,
    killZone,
    killColorTuple,
  });

  let timeout = null;
  let paused = false;
  function _resizeCanvas(useTimeout = true) {
    paused = true;
    clearTimeout(timeout);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    //Get the current size
    const rect = canvas.getBoundingClientRect();
    rect.height = canvas.height;
    rect.width = canvas.width;

    //Increase the size of the canvas
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;

    //Scale all drawings
    ctx.scale(devicePixelRatio, devicePixelRatio);

    //Scale everything down using css
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    timeout = setTimeout(
      () => {
        centerSpiral.setSize(rect);
        spiral.setSize(rect);
        killStageSpiral.setSize(rect);
        maxRadialDistance = spiral.maxRadialDistance;
        killZone.updateMaxKillRadius(spiral.maxRadialDistance / 2);
        killZone.setCenter(spiral.center());
        killStageSpiral.setCenter(spiral.center());
        paused = false;
      },
      useTimeout ? 100 : 0
    );
  }
  _resizeCanvas(false);

  addEventListener("resize", () => {
    _resizeCanvas();
  });

  const particles = []; // Store all particles
  const swallowedParticles = [];
  // Add a new particle to the canvas
  function addParticle({ value, colorTuple }) {
    const scaleFactor = hyperbolicInterpolation(
      value,
      { min: 0, max: 10000 },
      { min: 1, max: 3 },
      1 / 2
    );
    const particle = new Particle({
      ctx,
      value,
      options: {
        particleType: "circle",
        colorTuple,
        scaleFactor,
      },
    });
    particles.push(particle); // Add new particle to the array
  }

  let offsetTheta = (Math.random() * Math.PI) / 2;
  let offsetRadialDistance = 0;
  let offsetThetaOffset = Math.random() * Math.PI * 2;
  let offsetThetaChange = centerSpiral.seedRotateSpeed;
  let offsetThetaChangeDirection = 1;

  const addCenterOffset = () => {
    const inflectionPoint = 0.4 * spiral.nearestDeviceEdge;
    const maxDistance = 0.9 * spiral.nearestDeviceEdge;
    const minDistance = 0;
    const minThetaChange = centerSpiral.seedRotateSpeed / 5;

    if (offsetRadialDistance >= inflectionPoint) {
      offsetThetaChange = hyperbolicInterpolation(
        offsetRadialDistance,
        { min: inflectionPoint, max: maxDistance },
        { min: centerSpiral.seedRotateSpeed, max: minThetaChange },
        3
      );
    } else {
      offsetThetaChange = hyperbolicInterpolation(
        offsetRadialDistance,
        { min: minDistance, max: inflectionPoint },
        { min: minThetaChange, max: centerSpiral.seedRotateSpeed },
        1 / 3
      );
    }
    if (offsetRadialDistance >= maxDistance) {
      offsetThetaChangeDirection = -1;
      offsetThetaChange = minThetaChange;
    }
    if (offsetTheta <= 0) {
      offsetThetaChangeDirection = 1;
    }

    offsetTheta += offsetThetaChange * offsetThetaChangeDirection;
    offsetRadialDistance = centerSpiral.getRadialDistance(offsetTheta);

    const coordinates = centerSpiral.getCoordinates(
      offsetRadialDistance,
      offsetTheta,
      offsetThetaOffset
    );
    const spiralCenter = centerSpiral.center();
    const offset = {
      x: coordinates.x - spiralCenter.x,
      y: coordinates.y - spiralCenter.y,
    };
    spiral.setCenterOffset(offset);
    killStageSpiral.setCenter(spiral.center());
    killZone.setCenter(spiral.center());
  };

  let killCount = 0;
  let killCount2 = 0;

  const stage1KillCount = Math.min(150, mainSpiralOptions.baseFrameCount / 10);
  const stage2KillCount = stage1KillCount * 2;
  const stage3KillCount = stage2KillCount + 50;
  const stage1KillCount2 = 300;

  const animateStage1Particle = (particle) => {
    let _paused = paused;
    const killZoneRadius = killZone.currentRadius();
    if (
      !isKill &&
      (particle.radialDistance() < killZoneRadius || particle.theta() === 0) &&
      !particle.swallowed
    ) {
      killZone.addValue(particle.value);
      particle.swallowed = true;
      swallowedParticles.push(
        particle.clone({
          initialRadialDistance: 0,
          initialAlpha: 1,
          scaleFactor: 1,
        })
      );
    } else if (particle.radialDistance() < killZoneRadius) {
      _paused = true;
    }

    const rotateSpeedMultipler = linearInterpolation(
      killZoneRadius * 2 -
        killZone.distanceFromCenter(particle.lastCoordinates),
      { min: 0, max: 20 },
      { min: 1, max: 1.5 }
    );

    return particle.rotate(spiral, rotateSpeedMultipler, _paused);
  };

  const animateStage2Particle = (particle) => {
    return particle.rotate(killStageSpiral);
  };

  const trailAlpha = linearInterpolation(
    trailLength,
    { min: -20, max: 40 },
    { min: 0.4, max: 0.015 }
  );

  const changeMaxRadialDistanceInterval = mainSpiralOptions.baseFrameCount / 2;
  let maxRadialDistanceIntervalCount = 0;
  let maxRadialDistanceCount = 0;

  let lastMaxRadialDistance = 0.1 * maxRadialDistance;
  let nextMaxRadialDistance = 0.5 * maxRadialDistance;

  let maxRadialDistanceSteps = [0.4, 0.6, 0.8, 1];
  if (spiral.initialAspectRatio > 0.5) {
    maxRadialDistanceSteps = [0.3, 0.45, 0.65, 0.8];
  }
  function animate() {
    if (!isKill) {
      ctx.fillStyle = `rgb(0 0 0 / ${trailAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    let adjMaxRadialDistance = maxRadialDistance;
    if (killCount === 0) {
      if (maxRadialDistanceCount > 1.5 * changeMaxRadialDistanceInterval) {
        maxRadialDistanceIntervalCount++;
        lastMaxRadialDistance = nextMaxRadialDistance;
        let minNext = maxRadialDistanceSteps[1] * adjMaxRadialDistance;
        let maxNext = maxRadialDistanceSteps[3] * adjMaxRadialDistance;
        if (
          lastMaxRadialDistance >
            maxRadialDistanceSteps[2] * adjMaxRadialDistance ||
          lastMaxRadialDistance <
            maxRadialDistanceSteps[1] * adjMaxRadialDistance
        ) {
          minNext = maxRadialDistanceSteps[1] * adjMaxRadialDistance;
          maxNext = maxRadialDistanceSteps[2] * adjMaxRadialDistance;
        } else if (Math.random() > 0.5) {
          minNext = maxRadialDistanceSteps[2] * adjMaxRadialDistance;
          maxNext = maxRadialDistanceSteps[3] * adjMaxRadialDistance;
        } else {
          minNext = maxRadialDistanceSteps[0] * adjMaxRadialDistance;
          maxNext = maxRadialDistanceSteps[1] * adjMaxRadialDistance;
        }
        nextMaxRadialDistance = randomInRange(minNext, maxNext);
        maxRadialDistanceCount = 0;
      } else {
        maxRadialDistanceCount++;
      }
      adjMaxRadialDistance = linearInterpolation(
        maxRadialDistanceCount,
        { min: 0, max: changeMaxRadialDistanceInterval },
        { min: lastMaxRadialDistance, max: nextMaxRadialDistance }
      );
    }

    let newMaxKillRadius = adjMaxRadialDistance / 2;

    addCenterOffset();
    if (!isKill) {
      spiral.setMaxRadialDistance(adjMaxRadialDistance);
      killZone.updateMaxKillRadius(newMaxKillRadius);
    }

    if (killCount < stage1KillCount) {
      particles.forEach((particle, idx) => {
        const isDone = animateStage1Particle(particle);
        if (isDone) {
          particles.splice(idx, 1);
        }
      });
    } else if (killCount > stage3KillCount) {
      if (swallowedParticles.length === 0) {
        killCount2++;
      } else {
        swallowedParticles.forEach((particle, idx) => {
          const isDone = animateStage2Particle(particle);
          if (isDone) {
            swallowedParticles.splice(idx, 1);
          }
        });
      }
    }
    if (killCount2 > stage1KillCount2) {
      onDone?.();
      return;
    }
    killZone.draw(ctx);
    if (isKill) {
      try {
        if (killCount < stage2KillCount) {
          ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (killCount < stage3KillCount) {
          ctx.fillStyle = `rgba(0, 0, 0, 0.01)`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = `rgba(0, 0, 0, 0.02)`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (killCount < stage1KillCount) {
          newMaxKillRadius = hyperbolicInterpolation(
            killCount,
            { min: 0, max: stage1KillCount },
            {
              min: killZone.radiusWhenKill,
              max: Math.max(canvas.width, canvas.height),
            },
            1
          );
        } else if (killCount < stage2KillCount) {
          newMaxKillRadius = hyperbolicInterpolation(
            killCount,
            { min: stage1KillCount, max: stage2KillCount },
            { min: Math.max(canvas.width, canvas.height), max: 0 },
            1 / 10
          );
        } else {
          newMaxKillRadius = 0;
        }
        killZone.updateMaxKillRadius(newMaxKillRadius);
        killCount++;
      } catch (e) {
        console.log(e);
      }
    }
    requestAnimationFrame(animate);
  }

  const updateRotateSpeedMultiplier = (multiplier) => {
    spiral.setRotateSpeedMultiplier(multiplier);
    centerSpiral.setRotateSpeedMultiplier(multiplier);
    killStageSpiral.setRotateSpeedMultiplier(multiplier);
  };

  animate(); // Start the continuous animation loop
  return {
    addParticle,
    kill,
    updateRotateSpeedMultiplier,
  };
}
