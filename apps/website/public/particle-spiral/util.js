export const randomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

export const linearInterpolation = (
  value,
  inputRange = { min: 0, max: 300 },
  outputRange = { min: 1, max: 10 }
) => {
  value = Math.min(Math.max(value, inputRange.min), inputRange.max);
  // First normalize the input value to 0-1 range
  const normalizedValue =
    (value - inputRange.min) / (inputRange.max - inputRange.min);
  // Then scale it to the output range
  return (
    outputRange.min + normalizedValue * (outputRange.max - outputRange.min)
  );
};

export const hyperbolicInterpolation = (
  value,
  inputRange = { min: 0, max: 300 },
  outputRange = { min: 1, max: 10 },
  power = 2
) => {
  value = Math.min(Math.max(value, inputRange.min), inputRange.max);
  // Normalize input value to 0-1 range
  const normalizedValue =
    (value - inputRange.min) / (inputRange.max - inputRange.min);
  // Apply hyperbolic transformation using power function
  const transformedValue = Math.pow(normalizedValue, power);
  // Scale to output range
  return (
    outputRange.min + transformedValue * (outputRange.max - outputRange.min)
  );
};

export const bellCurveRandomInterpolation = (
  outputRange = { min: 1, max: 10 },
  power = 2
) => {
  const random = randomNegative(Math.pow(Math.random(), power));
  return linearInterpolation(
    random,
    {
      min: -1,
      max: 1,
    },
    outputRange
  );
};

export function randomBoxMuller({ min, max }, skew = 1, std = 10) {
  const u = 1 - Math.random(); //Converting [0,1) to (0,1]
  const v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  num = num / std + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) num = randomBoxMuller({ min, max }, skew, std);
  // resample between 0 and 1 if out of range
  else {
    num = Math.pow(num, skew); // Skew
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
  }
  return num;
}

export const randomNegative = (value = 1) => (Math.random() > 0.5 ? value : -value);

export const randomInversion = (value) =>
  Math.random() > 0.5 ? value : 1 / value;

export function getRandomValueFromArray(array) {
  if (array.length === 0) {
    return [null, -1];
  }
  const index = Math.floor(Math.random() * array.length);
  return [array[index], index];
}

export function hexToRgbTuple(hex) {
  // Remove the # if present
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((value) => `${value}${value}`)
      .join("");
  }

  // Parse the hex values into RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return [r, g, b];
}

// tailwind colors
export const COLORS = {
  [1]: [22, 163, 74], // #16a34a green-600
  [2]: [13, 148, 136], // #0d9488 teal-600
  [3]: [217, 119, 6], // #d97706 amber-600
  [4]: [185, 28, 28], // #b91c1c red-700
  [5]: [250, 204, 21], // #facc15 yellow-400
  [6]: [203, 213, 225], // #cbd5e1 slate-200
  [7]: [168, 162, 158], // #a8a29e stone-400
  [8]: [4, 120, 87], // #047857 emerald-700
  [9]: [2, 132, 199], // #0284c7 sky-600
  [10]: [29, 78, 216], // #1d4ed8 blue-700
  [11]: [99, 102, 241], // #6366f1 indigo-500
  [12]: [101, 163, 13], // #65a30d lime-600
  default: [16, 185, 129], // #10b981 emerald-500
};

export const PRISTINE_COLORS = {
  "christmas-card": [190, 29, 35],
  daily: [193, 2, 48],
  gear: [255, 149, 5],
  giveback: [133, 158, 188],
  helmet: [48, 188, 237],
  jersey: [246, 247, 64],
  monthly: [40, 40, 40],
  "new-year": [40, 40, 40],
  "pop-culture": [1, 253, 246],
  "sports-cards": [136, 132, 255],
  "sports-moments": [22, 219, 147],
  "ten-minute": [138, 36, 50],
  weekly: [174, 180, 169],
  "weekly-art": [255, 255, 255],
  "weekly-coin": [218, 163, 11],
  default: [255, 230, 0],
};

export function getColor(colorKey) {
  return COLORS.hasOwnProperty(colorKey) ? COLORS[colorKey] : COLORS.default;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const shuffleArrayOrder = (array) => {
  return array.sort(() => Math.random() - 0.5);
};
