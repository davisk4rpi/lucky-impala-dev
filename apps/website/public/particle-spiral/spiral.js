import { linearInterpolation } from "./util.js?v=7";

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

export const DEFAULT_SPIRAL_OPTIONS = {
  spiralC: 1.25,
  particleSizeRatio: 1 / 40,
  baseFrameCount: 3000,
  clockwise: false,
  randomCenter: {
    xFactor: 1,
    yFactor: 1,
  },
};
export function Spiral(rect, options = {}) {
  const _options = { ...DEFAULT_SPIRAL_OPTIONS, ...options };
  let bDivisor = 50;
  let particleSizeRandomFactor = Math.random() + 1;

  let _centerOffset = { x: 0, y: 0 };
  let _center = { x: 0, y: 0 };
  let particleSizeMultipler =
    particleSizeRandomFactor * _options.particleSizeRatio;
  let rotateSpeedMultiplier = 1;
  this.a = 0;
  this.b = 0;
  this.c = _options.spiralC;
  this.maxRadialDistance = 0;
  this.maxTheta = 0;
  this.inverseMaxTheta = 0;
  this.rotateSpeed = 0;
  this.seedMaxParticleSize = 0;
  this.spiralType = _options.spiralType;
  let _clockwise = 1;
  _clockwise = _options.clockwise ? -1 : 1;

  this.setRotateSpeedMultiplier = (multiplier) => {
    rotateSpeedMultiplier = multiplier;
    this.rotateSpeed = this.baseRotateSpeed();
  };

  this.setBaseFrameCount = (count) => {
    _options.baseFrameCount = count;
    this.rotateSpeed = this.baseRotateSpeed();
  };

  this.baseRotateSpeed = () =>
    (rotateSpeedMultiplier * this.maxTheta) / _options.baseFrameCount;

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
    this.rotateSpeed = this.baseRotateSpeed();
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
