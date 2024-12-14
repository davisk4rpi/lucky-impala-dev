import ParticleBlackHole from "./particle-black-hole.js?v=8";
import {
  simulateBidding,
  linearInterpolation,
  hyperbolicInterpolation,
  doublesidedHyperbolicInterpolation,
  COLORS,
  PRISTINE_COLORS,
} from "./util.js?v=6";

let isPristine = false;
const urlParams = new URLSearchParams(window.location.search);
isPristine = urlParams.get("c") === "pristine";
let jackpot = parseInt(urlParams.get("j") ?? "0");
let speed = urlParams.get("s");
let baseFrameRange = {
  min: isPristine ? 3000 : 1000,
  max: 7000,
};
const trailLengthConfig = {
  range: {
    min: 3,
    max: 25,
  },
  power: 2,
};
if (speed === "slow") {
  baseFrameRange = {
    min: 6000,
    max: 10000,
  };
  if (!jackpot) {
    jackpot = 30000;
  }
  trailLengthConfig.range.min = 10;
  trailLengthConfig.range.max = 40;
  trailLengthConfig.power = 2;
} else if (speed === "fast") {
  baseFrameRange = {
    min: isPristine ? 1000 : 500,
    max: 3000,
  };
  trailLengthConfig.range.min = -3;
  trailLengthConfig.range.max = 20;
  trailLengthConfig.power = 3;
  if (!jackpot) {
    jackpot = 5000;
  }
}
if (!jackpot) {
  jackpot = 20000;
}
console.log(trailLengthConfig);
export default function ScreenSaverController(canvasId) {
  let screenSaver;
  let killed = false;
  const getAuctionTypeColors = (async () => {
    return isPristine ? PRISTINE_COLORS : COLORS;
  })();

  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  // Resize the canvas to match window size
  function _resizeCanvas() {
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
    return rect;
  }

  function _keepAlive() {
    try {
      // TODO something to keep the page or device awake?
      setTimeout(_keepAlive, 30000);
    } catch (e) {
      console.log(e);
    }
  }

  function kill() {
    screenSaver.kill();
    killed = true;
  }

  async function initialize() {
    const auctionTypeColors = await getAuctionTypeColors;
    _keepAlive();
    const rect = _resizeCanvas();

    let onBidRefreshInfo;
    const simulateBiddingConfig = {
      delayRange: Math.random() * 7000 + 3000,
      isKill: false,
    };
    const start = () => {
      const speedRandomFactor = Math.random() + 1;
      const baseFrameRandom =
        Math.pow(Math.random(), 3) * (Math.random() > 0.5 ? 1 : -1);
      screenSaver = ParticleBlackHole({
        canvas,
        ctx,
        rect,
        onDone: () => {
          if (!killed) {
            simulateBiddingConfig.delayRange = Math.random() * 7000 + 1000;
            start();
          }
        },
        auctionTypeColors,
        jackpot: 20000,
        spiralOptions: {
          spiralType: "random",
          seedRotateSpeedMultiplier: speedRandomFactor, // lower multiplier means slower rotation
          particleSizeRatio: 1 / 30, // lower ratio means smaller particles
          baseFrameCount: linearInterpolation(
            baseFrameRandom,
            { min: -1, max: 1 },
            baseFrameRange
          ),
          clockwise: Math.random() > 0.5,
        },
        centerSpiralSpeedRatio: 1 / 15,
        trailLength: doublesidedHyperbolicInterpolation(
          Math.random(),
          { min: 0, max: 1 },
          trailLengthConfig.range,
          trailLengthConfig.power
        ),
      });
      onBidRefreshInfo = screenSaver.onBidRefreshInfo;
    };
    start();
    if (isPristine) {
      const socket = io("https://event.pristineauction.com", {
        transports: ["websocket"],
      });

      socket.on("BidRefreshInfo", (message) => {
        onBidRefreshInfo?.(message);
      });
    } else {
      simulateBidding(
        (bid) => {
          onBidRefreshInfo?.(bid);
        },
        0,
        simulateBiddingConfig
      );
    }
  }

  return {
    initialize,
    kill,
  };
}

const screenSaver = new ScreenSaverController("primary-canvas");
screenSaver.initialize();
