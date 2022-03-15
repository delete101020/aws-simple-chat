const isEmptyObject = (object: Record<string, unknown>) =>
  object && Object.keys(object).length === 0;

const isEmptyString = (str: string) => !str || !str.length;

const wait = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const randomInteger = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomBoolean = () => Math.random() >= 0.5;

/**
 * Only works for arrays of strings or numbers
 * @param array
 * @returns array of unique values
 */
const removeDuplicates = <T>(array: T[]) => [...new Set(array)];

export {
  isEmptyObject,
  isEmptyString,
  wait,
  randomInteger,
  randomBoolean,
  removeDuplicates,
};
