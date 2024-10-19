import { visitUrl } from "kolmafia";
import { between, extractInt, matchAll } from "./regex";

const locations = ["forest", "village", "castle"];
const singular: Record<string, string> = {
  werewolves: "werewolf",
  bugbears: "bugbear",
  ghosts: "ghost",
  zombies: "zombie",
  vampires: "vampire",
  skeletons: "skeleton",
};

const locationPopulation: Record<string, Array<string>> = {
  forest: ["werewolf", "bugbear"],
  village: ["ghost", "zombie"],
  castle: ["vampire", "skeleton"],
};
function tiltString(loc: string, amount: number): string {
  if (amount === 0) {
    return "no tilt";
  }
  const who = locationPopulation[loc][amount > 0 ? 0 : 1];
  return `towards ${who} x${Math.abs(amount)}`;
}

export class DreadStatus {
  open: boolean = false;
  sheets: number = 0;

  kills: Record<string, number> = {};
  tilt: Record<string, number> = {};
  monsterBanish: Record<string, number> = {};
  ncs: Record<string, number> = {};

  constructor() {
    this.init();
  }

  init(): void {
    this.open = false;
    this.sheets = 0;
    this.kills = { forest: 0, village: 0, castle: 0 };
    this.tilt = { forest: 0, village: 0, castle: 0 };
    this.monsterBanish = { werewolf: 0, bugbear: 0, ghost: 0, zombie: 0, vampire: 0, skeleton: 0 };
    this.ncs = {};
  }

  tiltString(loc: string): string {
    return tiltString(loc, this.tilt[loc]);
  }

  toArray(): string[] {
    const out = [];
    out.push(`Dread Status: ${this.open ? "Open" : "Closed"}`);
    out.push(`Sheets: ${this.sheets}`);
    for (const [place, kills] of Object.entries(this.kills)) {
      out.push(`Kills in ${place}: ${kills}`);
    }
    for (const location of locations) {
      out.push(`Tilt in ${location}: ${this.tiltString(location)}`);
    }
    for (const monster of Object.keys(this.monsterBanish)) {
      const count = this.monsterBanish[monster];
      if (count > 0) out.push(`Banished ${monster} ${count} times`);
    }
    return out;
  }
  toString(): string {
    return this.toArray().join("; ");
  }

  parseDreadRaidlog(page: string): void {
    const raidlog = between(page, "<b>Dreadsylvania", "<b>Loot Distribution:");
    this.init();

    if (raidlog === "") {
      return;
    }

    this.open = true;

    const sheets = extractInt(/got the carriageman ([0-9]+) sheet\(s\) drunker/gi, raidlog, 1);
    this.sheets = sheets;

    const tilts = matchAll(/drove some (.*?) out of the (.*?) \(/g, raidlog);
    for (const [, what, where] of Array.from(tilts)) {
      const idx = locationPopulation[where].indexOf(singular[what]);
      if (idx === -1) {
        continue;
      }
      this.monsterBanish[singular[what]] += 1;
      this.tilt[where] += idx === 0 ? -1 : 1;
    }
    const killmatch = matchAll(/\) defeated {2}(.*?) ([a-z]*?)( x ([0-9]+))? \(/gi, raidlog);
    for (const [, , who, , countstr] of Array.from(killmatch)) {
      // print(`all: "${all}", ele: ${ele}, who: "${who}", xwhat: "${xwhat}", countstr: "${countstr}"`);
      const count = countstr ? parseInt(countstr, 10) : 1;
      const where = locations.find((loc) => locationPopulation[loc].includes(who));
      if (where !== undefined) this.kills[where] += count;
    }
    if (raidlog.includes("made the forest less spooky")) {
      this.ncs["forest.13"] = 1;
    }
  }

  update(): void {
    const page = visitUrl("clan_raidlogs.php");
    this.parseDreadRaidlog(page);
  }
}

export const DreadStatusSingleton = new DreadStatus();
