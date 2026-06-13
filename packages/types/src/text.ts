export function toTitleCase(str: string) {
  return str
    .replaceAll(":", " – ")
    .replaceAll("_", " ")
    .replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase());
}
