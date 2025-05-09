export function stringify(obj: any): string {
  return stringifyWithBigIntSuffix(obj);
}

export function stringifyWithBigIntSuffix(obj: any): string {
  return JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() + 'n' : value
  );
}

export function parse(json: string): any {
  return parseWithBigIntSuffix(json);
}

export function parseWithBigIntSuffix(json: string): any {
  return JSON.parse(json, (_key, value) => {
    if (typeof value === 'string' && /^\d+n$/.test(value)) {
      try {
        return BigInt(value.slice(0, -1)); // remove 'n' suffix
      } catch {
        return value;
      }
    }
    return value;
  });
}
