export type Bump = "patch" | "minor" | "major";
export type Semver = { major: number; minor: number; patch: number };

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function parseSemver(value: string): Semver | null {
  const m = SEMVER.exec(value);
  return m ? { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) } : null;
}

export function bumpSemver(current: string | null, bump: Bump): string {
  const v = current ? parseSemver(current) : null;
  if (!v) return bump === "major" ? "1.0.0" : bump === "minor" ? "0.1.0" : "0.0.1";
  if (bump === "major") return `${v.major + 1}.0.0`;
  if (bump === "minor") return `${v.major}.${v.minor + 1}.0`;
  return `${v.major}.${v.minor}.${v.patch + 1}`;
}

export function compareSemver(a: string, b: string): number {
  const x = parseSemver(a);
  const y = parseSemver(b);
  if (!x || !y) throw new Error(`Invalid semver: ${!x ? a : b}`);
  return x.major - y.major || x.minor - y.minor || x.patch - y.patch;
}
