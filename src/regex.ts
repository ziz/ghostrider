export function extractInt(regex: RegExp, text: string, group = 1) {
  if (!regex.global) throw "Regexes must be global.";
  let result = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[group] === "a") {
      result += 1;
    } else {
      result += parseInt(match[group], 10);
    }
  }
  return result;
}

export function between(text: string, start: string, end: string) {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) return "";
  const endIndex = text.indexOf(end, startIndex + start.length);
  if (endIndex === -1) return "";
  return text.slice(startIndex + start.length, endIndex);
}

export function matchAll(regex: RegExp, text: string) {
  if (!regex.global) throw "Regexes must be global.";
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match);
  }
  return matches;
}
