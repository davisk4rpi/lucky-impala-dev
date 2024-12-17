import ParticleBlackHole from "./particle-black-hole.js?v=9";
import {
  bellCurveRandomInterpolation,
  COLORS,
  PRISTINE_COLORS,
  getRandomValueFromArray,
  randomInversion,
  randomNegative,
  randomInRange,
} from "./util.js?v=7";
import { ParticleGenerator } from "./particle-generator.js?v=0";

let isPristine = false;
const urlParams = new URLSearchParams(window.location.search);
isPristine = urlParams.get("c") === "pristine";
let jackpot = parseInt(urlParams.get("j") ?? "0");
let speed = urlParams.get("s");
let baseFrameRange = {
  min: 3000,
  max: 7000,
};
const trailLengthConfig = {
  range: {
    min: 5,
    max: 30,
  },
  power: 2,
};
if (speed === "slow") {
  baseFrameRange = {
    min: 5000,
    max: 8000,
  };
  if (!jackpot) {
    jackpot = 30000;
  }
  trailLengthConfig.range.min = 10;
  trailLengthConfig.range.max = 40;
  trailLengthConfig.power = 2;
} else if (speed === "fast") {
  baseFrameRange = {
    min: isPristine ? 2000 : 1000,
    max: 4000,
  };
  trailLengthConfig.range.min = -5;
  trailLengthConfig.range.max = 20;
  trailLengthConfig.power = 3;
  if (!jackpot) {
    jackpot = 5000;
  }
}
if (!jackpot) {
  jackpot = 20000;
}

const getInitialCenterRandomFactors = (aspectRatio) => {
  const min = 1 - 0.2 / aspectRatio;
  const max = 1 + 0.2 / aspectRatio;
  let xFactor = randomInRange(min, max);
  let yFactor = randomInRange(min, max);
  return {
    xFactor,
    yFactor,
  };
};

const deviceAspectRatio =
  Math.max(window.innerWidth, window.innerHeight) /
  Math.min(window.innerWidth, window.innerHeight);

export default function ScreenSaverController(canvasId) {
  let screenSaver;
  let killed = false;
  const getAuctionTypeColors = (async () => {
    return isPristine ? PRISTINE_COLORS : COLORS;
  })();

  const particleGenerator = new ParticleGenerator({
    onNewParticle: ({ value, colorTuple }) => {
      screenSaver?.addParticle?.({ value, colorTuple });
    },
  });

  function kill() {
    screenSaver.kill();
    particleGenerator.kill();
    killed = true;
  }

  let speedTimeouts = {};
  function varyRotateSpeed(
    spiralName,
    spiral,
    rotateSpeedMultiplier = randomInRange(0.5, 1.2),
    direction = randomNegative()
  ) {
    if (speedTimeouts[spiralName]) {
      clearTimeout(speedTimeouts[spiralName]);
    }
    if (killed) return;

    if (
      (rotateSpeedMultiplier > 1 || rotateSpeedMultiplier < 0.8) &&
      (rotateSpeedMultiplier > 1.2 ||
        rotateSpeedMultiplier < 0.5 ||
        Math.random() > 0.9)
    ) {
      direction = -direction;
    }
    rotateSpeedMultiplier += direction * 0.1;
    spiral.setRotateSpeedMultiplier(rotateSpeedMultiplier);
    speedTimeouts[spiralName] = setTimeout(() => {
      varyRotateSpeed(spiralName, spiral, rotateSpeedMultiplier, direction);
    }, randomInRange(3000, 15000));
  }

  async function initialize() {
    const auctionTypeColors = await getAuctionTypeColors;
    const [killColorTuple] = getRandomValueFromArray(
      Object.values(auctionTypeColors)
    );

    const start = () => {
      const skew = randomInversion(randomInRange(1, 3));
      particleGenerator.delayRange = {
        min: 500,
        max: 5000,
        skew,
      };
      const mainSpiralOptions = {
        particleSizeRatio: 1 / 30, // lower ratio means smaller particles
        baseFrameCount: bellCurveRandomInterpolation(baseFrameRange),
        clockwise: Math.random() > 0.5,
        c: randomInRange(0.5, 2),
        randomCenter: getInitialCenterRandomFactors(deviceAspectRatio),
      };

      let intervalId;
      screenSaver = ParticleBlackHole({
        canvasId,
        onDone: () => {
          if (!killed) {
            start();
            clearInterval(intervalId);
          }
        },
        killColorTuple,
        jackpot,
        mainSpiralOptions,
        centerSpiralOptions: {
          ...mainSpiralOptions,
          baseFrameCount:
            mainSpiralOptions.baseFrameCount * randomInRange(1.5, 5),
          randomCenter: getInitialCenterRandomFactors(deviceAspectRatio),
          c: randomInRange(1, 3),
          clockwise: Math.random() > 0.5,
        },
        killStageSpiralOptions: {
          ...mainSpiralOptions,
          randomCenter: { xFactor: 1, yFactor: 1 },
          c: randomInRange(1.25, 2.5),
          clockwise: !mainSpiralOptions.clockwise,
        },
        trailLength: bellCurveRandomInterpolation(
          trailLengthConfig.range,
          trailLengthConfig.power
        ),
      });
      varyRotateSpeed("main", screenSaver.mainSpiral);
      varyRotateSpeed("center", screenSaver.centerSpiral);
    };
    start();
    if (isPristine) {
      const socket = io("https://event.pristineauction.com", {
        transports: ["websocket"],
      });

      socket.on("BidRefreshInfo", (message) => {
        try {
          message = JSON.parse(message);
          const { auction_type_code, amount } = message;
          const colorTuple =
            auctionTypeColors[auction_type_code] ?? getColor(auction_type_code);

          screenSaver.addParticle({ value: amount, colorTuple });
        } catch (e) {
          console.log(e);
        }
      });
    } else {
      particleGenerator.start();
    }
  }

  return {
    initialize,
    kill,
  };
}

const screenSaver = new ScreenSaverController("primary-canvas");
screenSaver.initialize();
