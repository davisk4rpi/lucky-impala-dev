import ParticleBlackHole from "./particle-black-hole.js?v=6";
import {
  simulateBidding,
  linearInterpolation,
  hexToRgbTuple,
  COLORS,
} from "./util.js?v=4";

export default function ScreenSaverController(canvasId) {
  let screenSaver;
  let killed = false;
  const getAuctionTypeColors = (async () => {
    return COLORS;
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
            {
              min: 1000,
              max: 7000,
            }
          ),
          clockwise: Math.random() > 0.5,
        },
        centerSpiralSpeedRatio: 1 / 15,
      });
      onBidRefreshInfo = screenSaver.onBidRefreshInfo;
    };
    start();
    simulateBidding(
      (bid) => {
        onBidRefreshInfo?.(bid);
      },
      0,
      simulateBiddingConfig
    );
    // socket.on("BidRefreshInfo", (message) => {
    //   onBidRefreshInfo?.(message);
    // });
  }

  return {
    initialize,
    kill,
  };
}

console.log("run-screen-saver loaded");

const screenSaver = new ScreenSaverController("primary-canvas");
screenSaver.initialize();
