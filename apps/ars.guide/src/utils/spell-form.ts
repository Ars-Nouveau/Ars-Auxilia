type ValueObject = {
  text: string;
};

type ValueMap<T = ValueObject> = {
  [k: string]: T;
};

export const getMapText = (map: ValueMap) => (val: string) =>
  val in map ? map[val].text : val;

export const transformMultiSelect =
  (map: ValueMap) =>
  (val: string): string[] =>
    val.split(",").map(getMapText(map));
