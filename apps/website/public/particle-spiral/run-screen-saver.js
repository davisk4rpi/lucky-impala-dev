import ParticleBlackHole from "./particle-black-hole.js?v=1.2";
import {
  bellCurveRandomInterpolation,
  COLORS,
  getColor,
  PRISTINE_COLORS,
  getRandomValueFromArray,
  randomInversion,
  randomNegative,
  randomInRange,
  randomBoxMuller,
} from "./util.js?v=1.0";
import { ParticleGenerator } from "./particle-generator.js?v=1.0";

let isPristine = false;
const urlParams = new URLSearchParams(window.location.search);
isPristine = urlParams.get("c") === "pristine";
let jackpot = parseInt(urlParams.get("j") ?? "0");
let speed = urlParams.get("s");
let baseFrameRange = {
  min: 3000,
  max: 9000,
};
let centerSpiralBaseFrameRange = {
  min: 7000,
  max: 20000,
};
const trailLengthConfig = {
  range: {
    min: 15,
    max: 30,
  },
  power: 2,
};
if (speed === "slow") {
  baseFrameRange = {
    min: 5000,
    max: 10000,
  };
  centerSpiralBaseFrameRange = {
    min: 5000,
    max: 20000,
  };
  trailLengthConfig.range.min = 20;
  trailLengthConfig.range.max = 40;
  trailLengthConfig.power = 2;
} else if (speed === "fast") {
  baseFrameRange = {
    min: 1000,
    max: 4000,
  };
  centerSpiralBaseFrameRange = {
    min: 15000,
    max: 36000,
  };
  trailLengthConfig.range.min = -5;
  trailLengthConfig.range.max = 30;
  trailLengthConfig.power = 3;
} else if (speed === "hyper") {
  baseFrameRange = {
    min: 300,
    max: 1000,
  };
  centerSpiralBaseFrameRange = {
    min: 800,
    max: 2000,
  };
  trailLengthConfig.range.min = 40;
  trailLengthConfig.range.max = 40;
  trailLengthConfig.power = 1;
}
if (!jackpot) {
  jackpot = 2000;
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
    rotateSpeedMultiplier = randomInRange(0.5, 1.1),
    direction = randomNegative()
  ) {
    if (speedTimeouts[spiralName]) {
      clearTimeout(speedTimeouts[spiralName]);
    }
    if (killed) return;

    if (
      (rotateSpeedMultiplier > 0.9 || rotateSpeedMultiplier < 0.7) &&
      (rotateSpeedMultiplier > 1.1 ||
        rotateSpeedMultiplier < 0.5 ||
        Math.random() > 0.9)
    ) {
      direction = -direction;
    }
    rotateSpeedMultiplier += direction * 0.03;
    spiral.setRotateSpeedMultiplier(rotateSpeedMultiplier);
    speedTimeouts[spiralName] = setTimeout(() => {
      varyRotateSpeed(spiralName, spiral, rotateSpeedMultiplier, direction);
    }, randomInRange(3000, 15000));
  }

  async function initialize() {
    const auctionTypeColors = await getAuctionTypeColors;

    const start = () => {
      const [killColorTuple] = getRandomValueFromArray(
        Object.values(auctionTypeColors)
      );
      const skew = randomInversion(randomInRange(1, 3));
      particleGenerator.delayRange = {
        min: 500,
        max: 5000,
        skew,
      };
      const mainSpiralOptions = {
        particleSizeRatio: 1 / 30, // lower ratio means smaller particles
        baseFrameCount: randomBoxMuller(baseFrameRange, 1, 3),
        clockwise: Math.random() > 0.5,
        c: randomInversion(randomInRange(1, 100)),
        randomCenter: getInitialCenterRandomFactors(deviceAspectRatio),
      };
      const centerSpiralOptions = {
        ...mainSpiralOptions,
        baseFrameCount: randomBoxMuller(centerSpiralBaseFrameRange, 1, 3),
        randomCenter: getInitialCenterRandomFactors(deviceAspectRatio),
        c: randomInRange(1, 3),
        clockwise: Math.random() > 0.5,
      };
      const killStageSpiralOptions = {
        ...mainSpiralOptions,
        randomCenter: { xFactor: 1, yFactor: 1 },
        c: randomInRange(1.25, 2.5),
        clockwise: !mainSpiralOptions.clockwise,
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
        centerSpiralOptions,
        killStageSpiralOptions,
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
