import { WandererManager } from "garbo-lib";
import { getMonsters, myAdventures } from "kolmafia";
import { $location } from "libram";
import args from "./args";
import { ghostValue } from "./value";

let _wanderer: WandererManager | null = null;
export function wanderer(): WandererManager {
  return (_wanderer ??= new WandererManager({
    ascend: false,
    estimatedTurns: () => Math.min(myAdventures(), Math.abs(args.turns)),
    itemValue: ghostValue,
    effectValue: () => 0,
    prioritizeCappingGuzzlr: false,
    plentifulMonsters: [...getMonsters($location`Dreadsylvanian Village`)],
    freeFightExtraValue: () => 0,
  }));
}
