import {
  linearInterpolation,
  hyperbolicInterpolation,
  randomInRange,
} from "./util.js?v=1.0";
import { Particle } from "./particle.js?v=1.0";
import { Spiral, DEFAULT_SPIRAL_OPTIONS } from "./spiral.js?v=1.0";
import { KillZone } from "./kill-zone.js?v=1.0";

const deviceAspectRatio =
  Math.max(window.innerWidth, window.innerHeight) /
  Math.min(window.innerWidth, window.innerHeight);

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
    mainSpiralOptions,
    killStageSpiralOptions,
    centerSpiralOptions,
    spiral,
    killStageSpiral,
    centerSpiral,
    killZone,
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

    const setValues = () => {
      centerSpiral.setSize(rect);
      spiral.setSize(rect);
      killStageSpiral.setSize(rect);
      maxRadialDistance = spiral.maxRadialDistance;
      killZone.updateMaxKillRadius(spiral.maxRadialDistance / 2);
      killZone.setCenter(spiral.center());
      killStageSpiral.setCenter(spiral.center());
      paused = false;
    };

    if (useTimeout) {
      timeout = setTimeout(setValues, 100);
    } else {
      setValues();
    }
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
      { min: 1, max: 5000 },
      { min: 1, max: 4 },
      1 / 2
    );
    const particle = new Particle({
      ctx,
      value,
      options: {
        particleType: "circle",
        invertedParticleType: "stroke",
        colorTuple,
        scaleFactor,
      },
    });
    particles.push(particle); // Add new particle to the array
  }

  let offsetTheta = (Math.random() * Math.PI) / 2;
  let offsetRadialDistance = 0;
  let offsetThetaOffset = Math.random() * Math.PI * 2;
  let offsetThetaChange = centerSpiral.rotateSpeed;
  let offsetThetaChangeDirection = 1;

  const addCenterOffset = () => {
    const inflectionPoint = 0.4 * spiral.nearestDeviceEdge;
    const maxDistance = 0.9 * spiral.nearestDeviceEdge;
    const minDistance = 0;
    const minThetaChange = centerSpiral.rotateSpeed / 10;

    if (offsetRadialDistance >= inflectionPoint) {
      offsetThetaChange = hyperbolicInterpolation(
        offsetRadialDistance,
        { min: inflectionPoint, max: maxDistance },
        { min: centerSpiral.rotateSpeed, max: minThetaChange },
        3
      );
    } else {
      offsetThetaChange = hyperbolicInterpolation(
        offsetRadialDistance,
        { min: minDistance, max: inflectionPoint },
        { min: minThetaChange, max: centerSpiral.rotateSpeed },
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
  const stage2KillCount2 = stage1KillCount2 + 300;

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
          invertedParticleType: "circle",
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

  const changeMaxRadialDistanceInterval = Math.min(
    2000,
    mainSpiralOptions.baseFrameCount / 2
  );
  let maxRadialDistanceIntervalCount = 0;
  let maxRadialDistanceCount = 0;

  let lastMaxRadialDistance = 0.1 * maxRadialDistance;
  let nextMaxRadialDistance = 0.5 * maxRadialDistance;

  let maxRadialDistanceSteps = [0.4, 0.6, 0.8, 1];
  if (deviceAspectRatio > 16 / 9 || mainSpiralOptions.baseFrameCount < 6000) {
    maxRadialDistanceSteps = [0.3, 0.45, 0.65, 0.8];
  }
  function animate() {
    if (!isKill) {
      ctx.fillStyle = `rgb(0 0 0 / ${trailAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    let adjMaxRadialDistance = maxRadialDistance;
    if (killCount === 0) {
      if (maxRadialDistanceCount > 1.2 * changeMaxRadialDistanceInterval) {
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

    if (killCount < stage2KillCount) {
      addCenterOffset();
    } else if (killCount > stage3KillCount) {
      addCenterOffset();
    }
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
    if (killCount === stage3KillCount) {
      centerSpiral.setBaseFrameCount(centerSpiralOptions.baseFrameCount / 10);
    } else if (killCount2 > stage2KillCount2) {
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
        } else if (killCount2 > stage1KillCount2) {
          ctx.fillStyle = `rgba(0, 0, 0, 0.05)`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = `rgba(0, 0, 0, 0.0075)`;
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
    mainSpiral: spiral,
    killStageSpiral,
    centerSpiral,
  };
}
