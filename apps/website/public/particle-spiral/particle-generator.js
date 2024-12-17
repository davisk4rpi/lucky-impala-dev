import {
  COLORS,
  shuffleArrayOrder,
  randomBoxMuller,
  sleep,
} from "./util.js?v=8";

const DEFAULT_CONFIG = {
  firstDelay: 2000,
  delayRange: {
    min: 1000,
    max: 7000,
  },
  isKill: false,
  colors: Object.values(COLORS),
};
export class ParticleGenerator {
  _delayRange = DEFAULT_CONFIG.delayRange;
  _isKill = DEFAULT_CONFIG.isKill;
  onNewParticle = ({ value, colorTuple }) => console.log({ value, colorTuple });
  _colors = DEFAULT_CONFIG.colors;

  constructor({ onNewParticle, config }) {
    this.onNewParticle = onNewParticle;
    this.delayRange = config?.delayRange;
    this.colors = config?.colors;
  }

  get colors() {
    return this._colors;
  }

  set colors(colors) {
    this._colors = colors ?? DEFAULT_CONFIG.colors;
  }

  get delayRange() {
    return this._delayRange;
  }

  /**
   * @param {{ min: any; max: any; }} delayRange
   */
  set delayRange(delayRange) {
    this._delayRange = {
      min: delayRange?.min || DEFAULT_CONFIG.delayRange.min,
      max: delayRange?.max || DEFAULT_CONFIG.delayRange.max,
      skew: delayRange?.skew || 1,
    };
  }
  /**
   * @param {boolean} isKill
   */
  kill() {
    this._isKill = true;
  }

  shuffleColors() {
    this.colors = shuffleArrayOrder(this.colors);
  }

  async randomDelay() {
    return sleep(
      randomBoxMuller(
        { min: this.delayRange.min, max: this.delayRange.max },
        this.delayRange.skew
      )
    );
  }

  async generateParticles() {
    if (this._isKill) {
      return;
    }
    await this.randomDelay();
    const value = randomBoxMuller({ min: 1, max: 1000 }, 8, 2);
    const colorIndex = Math.floor(
      randomBoxMuller({ min: 0, max: this.colors.length - 0.0001 }, 1, 5)
    );
    const colorTuple = this.colors[colorIndex];

    this.onNewParticle({
      value,
      colorTuple,
    });

    return this.generateParticles();
  }

  start() {
    this.generateParticles();
  }
}
