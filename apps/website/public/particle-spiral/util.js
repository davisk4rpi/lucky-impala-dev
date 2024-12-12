export const linearInterpolation = (
  value,
  inputRange = { min: 0, max: 300 },
  outputRange = { min: 1, max: 10 }
) => {
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
  // Normalize input value to 0-1 range
  const normalizedValue =
    (value - inputRange.min) / (inputRange.max - inputRange.min);
  // Apply hyperbolic transformation using power function
  const transformedValue = Math.pow(normalizedValue, 1 / power);
  // Scale to output range
  return (
    outputRange.min + transformedValue * (outputRange.max - outputRange.min)
  );
};

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

export function getColor(auctionTypeCode) {
  return COLORS.hasOwnProperty(auctionTypeCode)
    ? COLORS[auctionTypeCode]
    : COLORS.default;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const TEST_BIDS = [
  { amount: 1, auction_type_code: "classic" },
  { amount: 1, auction_type_code: "classic" },
  { amount: 1, auction_type_code: "classic" },
  { amount: 1, auction_type_code: "classic" },
  { amount: 15, auction_type_code: "daily" },
  { amount: 67, auction_type_code: "sports-moments" },
  { amount: 23, auction_type_code: "daily" },
  { amount: 76, auction_type_code: "sports-moments" },
  { amount: 55, auction_type_code: "classic" },
  { amount: 3, auction_type_code: "daily" },
  { amount: 3, auction_type_code: "daily" },
  { amount: 1, auction_type_code: "daily" },
  { amount: 1, auction_type_code: "daily" },
  { amount: 1, auction_type_code: "daily" },
  { amount: 1, auction_type_code: "daily" },
  { amount: 1, auction_type_code: "daily" },
  { amount: 89, auction_type_code: "classic" },
  { amount: 456, auction_type_code: "sports-moments" },
  { amount: 41, auction_type_code: "sports-moments" },
  { amount: 924, auction_type_code: "daily" },
  { amount: 71, auction_type_code: "daily" },
  { amount: 28, auction_type_code: "classic" },
  { amount: 82, auction_type_code: "sports-gear" },
  { amount: 99, auction_type_code: "pop-culture" },
  { amount: 44, auction_type_code: "pop-culture" },
  { amount: 12, auction_type_code: "classic" },
  { amount: 95, auction_type_code: "ten-minute" },
  { amount: 34, auction_type_code: "daily" },
  { amount: 76, auction_type_code: "classic" },
  { amount: 181, auction_type_code: "daily" },
  { amount: 51, auction_type_code: "classic" },
  { amount: 7, auction_type_code: "ten-minute" },
  { amount: 62, auction_type_code: "sports-moments" },
  { amount: 412, auction_type_code: "sports-moments" },
  { amount: 29, auction_type_code: "sports-moments" },
  { amount: 84, auction_type_code: "daily" },
  { amount: 1278, auction_type_code: "pop-culture" },
  { amount: 19, auction_type_code: "pop-culture" },
  { amount: 73, auction_type_code: "sports-moments" },
  { amount: 38, auction_type_code: "pop-culture" },
  { amount: 92, auction_type_code: "classic" },
  { amount: 567, auction_type_code: "daily" },
  { amount: 57, auction_type_code: "classic" },
  { amount: 26, auction_type_code: "daily" },
  { amount: 78, auction_type_code: "classic" },
  { amount: 47, auction_type_code: "classic" },
  { amount: 9, auction_type_code: "daily" },
  { amount: 63, auction_type_code: "daily" },
  { amount: 80, auction_type_code: "sports-gear" },
  { amount: 33, auction_type_code: "sports-gear" },
  { amount: 81, auction_type_code: "sports-gear" },
  { amount: 16, auction_type_code: "daily" },
  { amount: 59, auction_type_code: "classic" },
  { amount: 98, auction_type_code: "classic" },
  { amount: 345, auction_type_code: "daily" },
  { amount: 49, auction_type_code: "daily" },
  { amount: 77, auction_type_code: "daily" },
  { amount: 31, auction_type_code: "classic" },
  { amount: 679, auction_type_code: "daily" },
  { amount: 53, auction_type_code: "daily" },
  { amount: 234, auction_type_code: "classic" },
  { amount: 85, auction_type_code: "classic" },
  { amount: 22, auction_type_code: "daily" },
  { amount: 69, auction_type_code: "classic" },
  { amount: 94, auction_type_code: "jersey" },
  { amount: 37, auction_type_code: "weekly" },
  { amount: 45, auction_type_code: "weekly" },
  { amount: 65, auction_type_code: "classic" },
  { amount: 14, auction_type_code: "jersey" },
  { amount: 42, auction_type_code: "daily" },
  { amount: 91, auction_type_code: "daily" },
  { amount: 24, auction_type_code: "classic" },
  { amount: 978, auction_type_code: "daily" },
  { amount: 345, auction_type_code: "classic" },
  { amount: 74, auction_type_code: "daily" },
  { amount: 287, auction_type_code: "weekly-coin" },
  { amount: 11, auction_type_code: "classic" },
  { amount: 96, auction_type_code: "classic" },
  { amount: 58, auction_type_code: "daily" },
  { amount: 35, auction_type_code: "classic" },
  { amount: 87, auction_type_code: "daily" },
  { amount: 123, auction_type_code: "classic" },
  { amount: 46, auction_type_code: "daily" },
  { amount: 17, auction_type_code: "classic" },
  { amount: 93, auction_type_code: "classic" },
  { amount: 52, auction_type_code: "weekly" },
  { amount: 27, auction_type_code: "classic" },
  { amount: 78, auction_type_code: "classic" },
  { amount: 6, auction_type_code: "daily" },
  { amount: 61, auction_type_code: "classic" },
  { amount: 32, auction_type_code: "weekly" },
  { amount: 189, auction_type_code: "daily" },
  { amount: 43, auction_type_code: "classic" },
  { amount: 89, auction_type_code: "weekly-coin" },
  { amount: 66, auction_type_code: "daily" },
  { amount: 156, auction_type_code: "weekly" },
  { amount: 25, auction_type_code: "daily" },
  { amount: 956, auction_type_code: "classic" },
  { amount: 36, auction_type_code: "weekly-coin" },
  { amount: 79, auction_type_code: "classic" },
  { amount: 8, auction_type_code: "daily" },
  { amount: 115, auction_type_code: "classic" },
  { amount: 48, auction_type_code: "weekly-art" },
  { amount: 21, auction_type_code: "weekly-art" },
  { amount: 68, auction_type_code: "classic" },
  { amount: 134, auction_type_code: "weekly-art" },
  { amount: 83, auction_type_code: "jersey" },
  { amount: 2, auction_type_code: "jersey" },
  { amount: 56, auction_type_code: "weekly-art" },
  { amount: 97, auction_type_code: "daily" },
  { amount: 99, auction_type_code: "helmet" },
  { amount: 39, auction_type_code: "helmet" },
  { amount: 102, auction_type_code: "daily" },
  { amount: 13, auction_type_code: "daily" },
  { amount: 86, auction_type_code: "helmet" },
  { amount: 60, auction_type_code: "daily" },
  { amount: 4, auction_type_code: "monthly" },
  { amount: 567, auction_type_code: "monthly" },
  { amount: 88, auction_type_code: "daily" },
  { amount: 99, auction_type_code: "weekly-coin" },
  { amount: 7890, auction_type_code: "monthly" },
  { amount: 18, auction_type_code: "classic" },
  { amount: 54, auction_type_code: "daily" },
  { amount: 356, auction_type_code: "classic" },
  { amount: 50, auction_type_code: "daily" },
  { amount: 99, auction_type_code: "classic" },
  { amount: 5, auction_type_code: "classic" },
  { amount: 70, auction_type_code: "jersey" },
  { amount: 45, auction_type_code: "daily" },
  { amount: 78, auction_type_code: "jersey" },
  { amount: 40, auction_type_code: "classic" },
  { amount: 75, auction_type_code: "daily" },
  { amount: 12, auction_type_code: "weekly" },
  { amount: 1, auction_type_code: "weekly" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 1, auction_type_code: "ten-minute" },
  { amount: 23, auction_type_code: "weekly" },
  { amount: 141, auction_type_code: "weekly" },
];

const shuffleArrayOrder = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

export async function simulateBidding(
  onBidRefreshInfo,
  firstDelay = 2000,
  config = {
    delayRange: 7000,
    isKill: false,
  }
) {
  await sleep(firstDelay);
  const bids = shuffleArrayOrder([...TEST_BIDS]);
  // onBidRefreshInfo?.(JSON.stringify({ amount: 1, auction_type_code: "daily" }));

  for (const bid of bids) {
    await sleep(Math.random() * Math.min(config.delayRange, 2000));
    bid.auction_type_code = getRandomValueFromArray(Object.keys(COLORS))[0];
    onBidRefreshInfo?.(JSON.stringify(bid));
  }
  if (config.isKill) {
    return;
  }
  return simulateBidding(onBidRefreshInfo, 0, config);
}
