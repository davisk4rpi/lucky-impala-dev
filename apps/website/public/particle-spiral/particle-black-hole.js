import {
  getColor,
  linearInterpolation,
  hyperbolicInterpolation,
  getRandomValueFromArray,
} from "./util.js";

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
  spiralType: "random",
  seedRotateSpeedMultiplier: 0.0005,
  particleSizeRatio: 1 / 40,
};
function Spiral(rect, options = {}) {
  const _options = { ...DEFAULT_SPIRAL_OPTIONS, ...options };
  let bDivisor = 50;
  let cRandom = Math.random() + 1;
  let particleSizeRandomFactor = Math.random() + 1;
  let rotateSpeedRandomFactor = Math.random() + 0.5;

  let centerXRandomFactor = linearInterpolation(
    Math.random(),
    { min: 0, max: 1 },
    { min: -0.2, max: 0.2 }
  );
  let centerYRandomFactor = linearInterpolation(
    Math.random(),
    { min: 0, max: 1 },
    { min: -0.2, max: 0.2 }
  );

  let _centerOffset = { x: 0, y: 0 };
  let _center = { x: 0, y: 0 };
  let particleSizeMultipler =
    particleSizeRandomFactor * _options.particleSizeRatio;
  let seedRotateSpeedMultiplier =
    _options.seedRotateSpeedMultiplier * rotateSpeedRandomFactor;
  this.a = 0;
  this.b = 0;
  this.c = 1;
  this.maxRadialDistance = 0;
  this.seedRotateSpeed = 0;
  this.seedMaxParticleSize = 0;
  this.initialRadialDistance = 0;
  this.spiralType = _options.spiralType;

  this.setMaxRadialDistance = (maxRadialDistance) => {
    this.maxRadialDistance = Math.max(maxRadialDistance, 1);
    this.b = this.maxRadialDistance / Math.pow(bDivisor, 1 / this.c);
    this.seedMaxParticleSize = this.maxRadialDistance * particleSizeMultipler;
    this.initialRadialDistance =
      this.maxRadialDistance - this.seedMaxParticleSize;
  };
  this.baseSeedRotateSpeed = () =>
    seedRotateSpeedMultiplier * Math.sqrt(this.maxRadialDistance / 2);

  this.centerOffset = () => _centerOffset;
  this.center = () => {
    return {
      x: _center.x + _centerOffset.x,
      y: _center.y + _centerOffset.y,
    };
  };
  this.setCenterOffset = ({ x = 0, y = 0 }) => {
    _centerOffset.x = x;
    _centerOffset.y = y;
  };

  this.setSize = (rect) => {
    switch (this.spiralType) {
      case "random":
        this.c = cRandom;
        break;
      case "fermat":
        this.c = 2;
        break;
      case "fermat2":
        this.c = 5 / 4;
        break;
      case "archimedean":
      default:
        this.c = 1;
    }
    _center = {
      x: (rect.width / 2) * (1 + centerXRandomFactor),
      y: (rect.height / 2) * (1 + centerYRandomFactor),
    };
    const maxRadialDistance =
      Math.sqrt(Math.pow(rect.width, 2) + Math.pow(rect.height, 2)) / 2;
    this.setMaxRadialDistance(maxRadialDistance);
    this.seedRotateSpeed = this.baseSeedRotateSpeed();
  };
  this.setSize(rect);

  this.getRadialDistance = (theta = 0, bFactor = 1) => {
    let _theta = Math.abs(theta);
    let power = 1 / this.c;
    if (_theta === 0) {
      return this.a;
    } else if (theta < 0) {
      power = this.c;
    }
    return this.a + bFactor * this.b * Math.pow(_theta, power);
  };

  this.getTheta = (radialDistance, bFactor = 1) => {
    if (radialDistance === this.a) {
      return 0;
    }
    return Math.pow(
      Math.abs((radialDistance - this.a) / (bFactor * this.b)),
      this.c
    );
  };

  this.getInitialTheta = (bFactor = 1) =>
    this.getTheta(this.initialRadialDistance, bFactor);

  this.getCoordinates = (radialDistance, theta, thetaOffset = 0) => {
    let { x, y } = this.center();
    const xLength = radialDistance * Math.cos(Math.abs(theta) + thetaOffset);
    const yLength = radialDistance * Math.sin(Math.abs(theta) + thetaOffset);
    if (theta < 0) {
      x -= xLength;
      y -= yLength;
    } else {
      x += xLength;
      y += yLength;
    }
    return {
      x,
      y,
    };
  };
  this.calculateParticleSize = (radialDistance) => {
    let absRadialDistance = Math.abs(radialDistance);
    let particleSize = linearInterpolation(
      absRadialDistance,
      { min: 0, max: Math.max(this.maxRadialDistance, absRadialDistance) },
      { min: 1, max: this.seedMaxParticleSize }
    );
    return particleSize;
  };
}

function KillZone({
  killColor,
  maxKillRadius,
  center,
  kill,
  calculateParticleSize,
  killValue,
}) {
  let currentValue = 0;
  let growRadius = 0;
  let currentRadius = 0;
  let randomKillFactor = Math.random();
  let _center = center;
  let _centerOffset = { x: 0, y: 0 };
  const killRadiusFactor = linearInterpolation(
    randomKillFactor,
    { min: 0, max: 1 },
    { min: 0.75, max: 0.95 }
  );
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
    growRadius = this.growRadius();
  };

  this.addValue = (value) => {
    currentValue += value;
    growRadius = this.growRadius();
    if (currentValue > killValue) {
      kill?.();
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
    if (growRadius > currentRadius) {
      const radiusDelta = growRadius - currentRadius;
      currentRadius += Math.min(radiusDelta / 10, 0.5);
    } else {
      currentRadius = growRadius;
    }
    const lineWidth = Math.max(2, calculateParticleSize(currentRadius)) / 2;
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

function Particle({ colorTuple, ctx, amount = 0 }) {
  const bFactor = linearInterpolation(
    Math.random(),
    { min: 0, max: 1 },
    { min: 0.5, max: 1 }
  );
  const strokeColor = `rgba(${colorTuple.join(",")}, 0.5)`;
  const scaleFactor = hyperbolicInterpolation(
    amount,
    { min: 0, max: Math.max(10000, amount) },
    { min: 1, max: 3 },
    2
  );
  const thetaOffset = Math.random() * Math.PI * 2;
  let radialDistance = Infinity;
  let theta = undefined;
  let lastCoordinates = { x: 0, y: 0 };
  this.theta = () => theta;
  this.radialDistance = () => radialDistance;
  this.scaleFactor = () => scaleFactor;
  this.amount = () => amount;
  this.colorTuple = colorTuple;
  this.rotate = (spiral, killZone, paused = false) => {
    if (theta === undefined) {
      radialDistance = spiral.initialRadialDistance;
      theta = spiral.getTheta(radialDistance, bFactor);
      lastCoordinates = spiral.getCoordinates(
        radialDistance,
        theta,
        thetaOffset
      );
    }
    const currentRadius = killZone.currentRadius();
    const rotateSpeedMultipler = linearInterpolation(
      Math.min(
        10,
        Math.max(
          currentRadius * 2 - killZone.distanceFromCenter(lastCoordinates),
          0
        )
      ),
      { min: 0, max: 20 },
      { min: 1, max: 1.5 }
    );

    const rotateSpeed =
      (spiral.seedRotateSpeed / (scaleFactor * scaleFactor)) *
      rotateSpeedMultipler;
    if (Math.abs(theta) < rotateSpeed && theta !== 0) {
      theta = 0;
    } else {
      theta -= rotateSpeed;
      if (theta < 0) {
        theta -= rotateSpeed;
      }
    }
    radialDistance = spiral.getRadialDistance(theta, bFactor);
    const absRadialDistance = Math.abs(radialDistance);
    const particleSize =
      spiral.calculateParticleSize(radialDistance) * scaleFactor;

    const coordinates = spiral.getCoordinates(
      radialDistance,
      theta,
      thetaOffset
    );
    if (
      absRadialDistance > spiral.maxRadialDistance &&
      (coordinates.x < 0 ||
        coordinates.y < 0 ||
        coordinates.x > ctx.canvas.width ||
        coordinates.y > ctx.canvas.height)
    ) {
      return true;
    }
    if (paused === false || (paused === "positive" && theta < 0)) {
      ctx.beginPath();
      ctx.lineWidth = particleSize;
      ctx.strokeStyle = strokeColor;
      const startX =
        lastCoordinates.x - (coordinates.x - lastCoordinates.x) * scaleFactor;
      const startY =
        lastCoordinates.y - (coordinates.y - lastCoordinates.y) * scaleFactor;
      ctx.moveTo(startX, startY);
      ctx.lineTo(coordinates.x, coordinates.y);
      ctx.stroke();
    }
    lastCoordinates = coordinates;
  };
}

export default function ParticleBlackHole({
  canvas,
  ctx,
  onDone,
  auctionTypeColors,
  jackpot = 10000,
  spiralOptions = DEFAULT_SPIRAL_OPTIONS,
  maxKillCount = 500,
  changeMaxRadialDistanceInterval = 1500,
}) {
  let isKill = false;
  function kill() {
    isKill = true;
  }

  ctx.globalAlpha = 1;

  const spiral = new Spiral(
    { height: canvas.height, width: canvas.width },
    spiralOptions
  );
  const centerSpiral = new Spiral(
    { height: canvas.height, width: canvas.width },
    {
      seedRotateSpeedMultiplier: spiralOptions.seedRotateSpeedMultiplier,
    }
  );
  let maxRadialDistance = spiral.maxRadialDistance;
  const [killColor] = getRandomValueFromArray(Object.values(auctionTypeColors));
  let killZone = new KillZone({
    center: spiral.center(),
    maxKillRadius: spiral.maxRadialDistance / 2,
    killColor,
    kill,
    calculateParticleSize: (radialDistance) =>
      spiral.calculateParticleSize(radialDistance),
    killValue: jackpot,
  });

  console.log(spiral, centerSpiral, killZone, killColor);

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
        maxRadialDistance = spiral.maxRadialDistance;
        killZone.updateMaxKillRadius(spiral.maxRadialDistance / 2);
        killZone.setCenter(spiral.center());

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

  // Add a new particle to the canvas
  function addParticle(amount, auctionTypeCode) {
    const colorTuple =
      auctionTypeColors[auctionTypeCode] ?? getColor(auctionTypeCode);

    const particle = new Particle({
      ctx,
      colorTuple,
      amount,
    });
    particles.push(particle); // Add new particle to the array
  }

  let maxRadialDistanceCount = 0;
  let killCount = 0;

  let offsetTheta = Math.random() * Math.PI * 2;
  let offsetRadialDistance = 0;
  let offsetThetaOffset = Math.random() * Math.PI * 2;
  let offsetThetaChange = spiralOptions.seedRotateSpeedMultiplier;
  let offsetThetaChangeDirection = 1;

  const addCenterOffset = () => {
    const inflectionPoint = 0.25 * maxRadialDistance;
    const maxDistance = 0.5 * maxRadialDistance;
    const minDistance = 0;
    const minThetaChange = spiralOptions.seedRotateSpeedMultiplier / 5;

    if (offsetRadialDistance >= inflectionPoint) {
      offsetThetaChange = hyperbolicInterpolation(
        Math.min(offsetRadialDistance, maxDistance),
        { min: inflectionPoint, max: maxDistance },
        { min: spiralOptions.seedRotateSpeedMultiplier, max: minThetaChange },
        1 / 3
      );
    } else {
      offsetThetaChange = hyperbolicInterpolation(
        Math.max(offsetRadialDistance, minDistance),
        { min: minDistance, max: inflectionPoint },
        { min: minThetaChange, max: spiralOptions.seedRotateSpeedMultiplier },
        3
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
    const percent = (offsetRadialDistance / maxDistance) * 100;
    if (percent > 100) {
      console.log(
        offsetTheta,
        offsetThetaChange * offsetThetaChangeDirection,
        percent.toFixed(0),
        offsetRadialDistance,
        maxDistance
      );
    }
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
    killZone.setCenter(spiral.center());
  };
  addCenterOffset();

  let maxRadialDistanceIntervalCount = 0;
  let lastMaxRadialDistance = 0.1 * maxRadialDistance;
  let nextMaxRadialDistance = 0.5 * maxRadialDistance;
  function animate() {
    if (!isKill) {
      ctx.fillStyle = "rgb(0 0 0 / 5%)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    let adjMaxRadialDistance = maxRadialDistance;
    if (killCount > 0) {
      spiral.seedRotateSpeed = hyperbolicInterpolation(
        killCount,
        { min: 0, max: maxKillCount },
        {
          min: spiral.baseSeedRotateSpeed(),
          max: spiral.baseSeedRotateSpeed() * -20,
        },
        1 / 4
      );
      adjMaxRadialDistance = hyperbolicInterpolation(
        killCount,
        { min: 0, max: maxKillCount },
        { min: maxRadialDistance, max: 0 },
        1 / 5
      );
    }
    if (maxRadialDistanceCount > 1.5 * changeMaxRadialDistanceInterval) {
      maxRadialDistanceIntervalCount++;
      lastMaxRadialDistance = nextMaxRadialDistance;
      const outputRange = {
        min: 0.6 * adjMaxRadialDistance,
        max: 1 * adjMaxRadialDistance,
      };
      if (
        lastMaxRadialDistance > 0.8 * adjMaxRadialDistance ||
        lastMaxRadialDistance < 0.6 * adjMaxRadialDistance
      ) {
        outputRange.min = 0.6 * adjMaxRadialDistance;
        outputRange.max = 0.8 * adjMaxRadialDistance;
      } else if (Math.random() > 0.3) {
        outputRange.min = 0.8 * adjMaxRadialDistance;
        outputRange.max = 1 * adjMaxRadialDistance;
      } else {
        outputRange.min = 0.4 * adjMaxRadialDistance;
        outputRange.max = 0.6 * adjMaxRadialDistance;
      }
      nextMaxRadialDistance = linearInterpolation(
        Math.random(),
        { min: 0, max: 1 },
        outputRange
      );
      maxRadialDistanceCount = 0;
    } else {
      maxRadialDistanceCount++;
    }
    adjMaxRadialDistance = hyperbolicInterpolation(
      Math.min(maxRadialDistanceCount, changeMaxRadialDistanceInterval),
      { min: 0, max: changeMaxRadialDistanceInterval },
      { min: lastMaxRadialDistance, max: nextMaxRadialDistance },
      1
    );

    if (killZone.currentRadius() > 10) {
      addCenterOffset();
    }
    if (!isKill) {
      spiral.setMaxRadialDistance(adjMaxRadialDistance);
      killZone.updateMaxKillRadius(adjMaxRadialDistance / 2);
    }

    particles.forEach((particle, idx) => {
      let _paused = paused;
      if (
        !isKill &&
        (particle.radialDistance() < killZone.currentRadius() ||
          particle.theta() === 0) &&
        !particle.swallowed
      ) {
        killZone.addValue(particle.amount());
        particle.swallowed = true;
      } else if (particle.radialDistance() < killZone.currentRadius()) {
        _paused = true;
      }

      const isDone = particle.rotate(spiral, killZone, _paused);

      if (isDone) {
        particles.splice(idx, 1);
      }
    });
    killZone.draw(ctx);
    if (isKill) {
      const alpha = killCount / maxKillCount;
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const maxRadius = adjMaxRadialDistance / 2;

      const newMaxKillRadius = hyperbolicInterpolation(
        killCount,
        { min: 0, max: maxKillCount },
        { min: maxRadius, max: 0 },
        5
      );
      killZone.updateMaxKillRadius(newMaxKillRadius);
      if (killCount < maxKillCount) {
        killCount++;
      } else {
        onDone?.();
        return;
      }
    }
    requestAnimationFrame(animate);
  }

  function onBidRefreshInfo(message) {
    try {
      message = JSON.parse(message);
      addParticle(message.amount, message.auction_type_code);
    } catch (e) {
      console.log(e);
    }
  }
  animate(); // Start the continuous animation loop
  return {
    onBidRefreshInfo,
    kill,
  };
}
