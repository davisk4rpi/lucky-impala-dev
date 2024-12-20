import { linearInterpolation, randomInRange } from "./util.js?v=1.0";

export function KillZone({
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
