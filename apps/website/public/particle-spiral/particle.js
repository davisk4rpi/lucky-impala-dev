import { randomInRange } from "./util.js?v=1.0";

const drawParticleCircle = (ctx, { coordinates, particleSize, colorStyle }) => {
  ctx.beginPath();
  ctx.fillStyle = colorStyle;
  ctx.arc(coordinates.x, coordinates.y, particleSize / 2, 0, Math.PI * 2);
  ctx.fill();
};
const drawParticleStroke = (
  ctx,
  { lastCoordinates, coordinates, particleSize, colorStyle }
) => {
  ctx.beginPath();
  ctx.strokeStyle = colorStyle;
  ctx.lineWidth = particleSize;
  ctx.moveTo(lastCoordinates.x, lastCoordinates.y);
  ctx.lineTo(coordinates.x, coordinates.y);
  ctx.stroke();
};

export function Particle({ ctx, value = 0, options = {} }) {
  this.value = value;
  this.particleType = options?.particleType ?? "circle";
  this.invertedParticleType =
    options?.invertedParticleType ?? this.particleType;
  this.lastCoordinates = { x: 0, y: 0 };
  this.scaleFactor = options?.scaleFactor ?? 1;

  const colorTuple = options?.colorTuple ?? [40, 40, 40];
  const _joinedColorTuple = colorTuple.join(",");
  const finalOpacity = this.particleType === "circle" ? 1 : 0.5;
  let alpha = options.initialAlpha ?? 0;
  const stepAlpha = () => {
    alpha += 0.005;
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
  this.clone = ({
    initialRadialDistance,
    initialAlpha,
    scaleFactor,
    particleType,
    invertedParticleType,
  }) => {
    const particle = new Particle({
      ctx,
      value,
      options: {
        colorTuple,
        particleType: particleType ?? this.particleType,
        invertedParticleType: invertedParticleType ?? this.invertedParticleType,
        thetaOffset: state.thetaOffset,
        bFactor: state.bFactor,
        initialRadialDistance,
        initialAlpha,
        scaleFactor: scaleFactor ?? this.scaleFactor,
      },
    });
    return particle;
  };

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
      (spiral.rotateSpeed / Math.sqrt(this.scaleFactor)) * rotateSpeedMultipler;
    if (Math.abs(state.theta) < rotateSpeed && state.theta !== 0) {
      state.theta = 0;
    } else {
      state.theta -= rotateSpeed;
      if (state.theta < 0) {
        state.theta -= rotateSpeed;
        this.particleType = "stroke";
      }
    }
    state.radialDistance = spiral.getRadialDistance(state.theta, state.bFactor);

    const absRadialDistance = Math.abs(state.radialDistance);
    let particleSize = spiral.calculateParticleSize({
      theta: state.theta,
      bFactor: state.bFactor,
    }) * alpha;
    const particleType =
      state.theta >= 0 ? this.particleType : this.invertedParticleType;
    if (particleType === "stroke") {
      particleSize *= this.scaleFactor;
    } else {
      particleSize *= this.scaleFactor * this.scaleFactor;
    }

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
      if (particleType === "circle") {
        drawParticleCircle(ctx, {
          coordinates,
          particleSize,
          colorStyle: colorStyle(),
        });
      } else {
        drawParticleStroke(ctx, {
          lastCoordinates: this.lastCoordinates,
          coordinates,
          particleSize,
          colorStyle: colorStyle(),
        });
      }
    }
    this.lastCoordinates = coordinates;
    return false;
  };
}
