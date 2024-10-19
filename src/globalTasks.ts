import { DraggableFight, WanderDetails } from "garbo-lib";
import { Modes, Outfit } from "grimoire-kolmafia";
import {
  abort,
  adv1,
  cliExecute,
  eat,
  fullnessLimit,
  getWorkshed,
  inebrietyLimit,
  Item,
  Location,
  mallPrices,
  myClass,
  myFullness,
  myHp,
  myInebriety,
  retrieveItem,
  reverseNumberology,
  runChoice,
  sessionStorage,
  todayToString,
  totalTurnsPlayed,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $classes,
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $phylum,
  $skill,
  ActionSource,
  AutumnAton,
  Counter,
  ensureFreeRun,
  get,
  getKramcoWandererChance,
  have,
  JuneCleaver,
  set,
  Snapper,
  SourceTerminal,
  TrainSet,
  tryFindFreeRun,
  withProperty,
} from "libram";
import args from "./args";
import { GhostStrategy, Macro } from "./combat";
import { GhostTask, shouldRedigitize } from "./lib";
import { combatOutfit, digitizeOutfit } from "./outfit";
import {
  bestAutumnatonLocation,
  coldMedicineCabinet,
  getBestPantsgivingFood,
  juneCleaverChoices,
  rotateTrainToOptimalCycle,
  willRotateTrainset,
} from "./resources";
import { wanderer } from "./wanderer";

let _digitizeInitialized = true;

function digitizeInitialized(): void {
  _digitizeInitialized = true;
}

let runSource: ActionSource | null = null;

function getRunSource(): ActionSource {
  if (!runSource) {
    runSource =
      tryFindFreeRun() ??
      ensureFreeRun({
        requireUnlimited: () => true,
        noFamiliar: () => true,
        noRequirements: () => true,
        maximumCost: () => get("autoBuyPriceLimit") ?? 20000,
      });
  }
  if (!runSource) abort("Unable to find free run with which to initialize digitize!");
  return runSource;
}

function makeWandererTask(
  type: DraggableFight,
  drunkSafe: boolean,
  base: Omit<GhostTask, "do" | "outfit" | "sobriety" | "choices"> &
    Partial<{
      combat: GhostStrategy;
      do: () => Location;
      sobriety: "sober" | "drunk";
      outfit: () => Outfit;
    }>,
  equip: Item[] = [],
  modes: Modes = {},
): GhostTask {
  const sobriety = drunkSafe ? undefined : "sober";
  const options: WanderDetails = drunkSafe ? { wanderer: type, drunkSafe } : type;
  return {
    sobriety,
    do: () => wanderer().getTarget(options),
    choices: () => wanderer().getChoices(options),
    combat: new GhostStrategy(),
    outfit: () => combatOutfit({ equip: wanderer().getEquipment(options).concat(equip), modes }),
    ...base,
  };
}

const GLOBAL_TASKS: GhostTask[] = [
  {
    name: "Search the Mall",
    completed: () => sessionStorage.getItem("last mallprices") === todayToString(),
    do: (): void => {
      mallPrices("allitems");
      sessionStorage.setItem("last mallprices", todayToString());
    },
  },

  {
    name: "Acquire Kgnee",
    ready: () =>
      have($familiar`Reagnimated Gnome`) &&
      !have($item`gnomish housemaid's kgnee`) &&
      !get("_ghostrider_checkedGnome", false),
    completed: () => get("_ghostrider_checkedGnome", false),
    do: (): void => {
      visitUrl("arena.php");
      runChoice(4);
      set("_ghostrider_checkedGnome", true);
    },
    outfit: { familiar: $familiar`Reagnimated Gnome` },
    limit: { tries: 1 },
  },
  {
    name: "Ow!",
    completed: () => myHp() > 0,
    do: () =>
      abort(
        "I don't want to be remembered at all. If I'm being remembered, it means I'm dead. (0 hp)",
      ),
  },
  {
    name: "Check combat lost",
    completed: () => !get("_lastCombatLost", false),
    do: () => abort("Lost in combat!"),
  },
  {
    name: "You cannot live in fear. (Lick wounds)",
    ready: () => have($skill`Tongue of the Walrus`),
    completed: () => !have($effect`Beaten Up`),
    do: () => useSkill($skill`Tongue of the Walrus`),
  },
  {
    name: "Sweat Out some Booze",
    completed: () => get("_sweatOutSomeBoozeUsed") >= 3,
    ready: () => myInebriety() > 0 && get("sweat") >= 25,
    do: () => useSkill($skill`Sweat Out Some Booze`),
    outfit: { pants: $item`designer sweatpants` },
    sobriety: "sober",
  },
  {
    name: "Numberology",
    ready: () => Object.values(reverseNumberology()).includes(69),
    completed: () => get("_universeCalculated") >= get("skillLevel144"),
    do: () => cliExecute("numberology 69"),
  },
  {
    name: "Magical Sausage",
    ready: () =>
      $items`magical sausage, magical sausage casing`.some((i) => have(i)) &&
      $items`Kramco Sausage-o-Matic™, replica Kramco Sausage-o-Matic™`.some((i) => have(i)),
    completed: () => get("_sausagesEaten") >= 23 || myFullness() > fullnessLimit(),
    do: () => eat($item`magical sausage`),
  },
  {
    name: "License to Chill",
    ready: () => have($item`License to Chill`),
    completed: () => get("_licenseToChillUsed"),
    do: () => use($item`License to Chill`),
  },
  {
    name: "Fill Pantsgiving Fullness",
    ready: () =>
      !$classes`Vampyre, Grey Goo`.includes(myClass()) && myFullness() + 1 === fullnessLimit(),
    completed: () => myFullness() >= fullnessLimit(),
    do: (): void => {
      const { food } = getBestPantsgivingFood();
      if (!get("_fudgeSporkUsed")) {
        retrieveItem($item`fudge spork`);
        eat($item`fudge spork`);
      }
      retrieveItem(food);
      eat(food);
    },
  },
  {
    name: "Autumn-Aton",
    completed: () => !AutumnAton.available(),
    do: (): void => {
      AutumnAton.sendTo(bestAutumnatonLocation);
    },
  },
  {
    name: "Cold Medicine Cabinet",
    ready: () => getWorkshed() === $item`cold medicine cabinet`,
    completed: () =>
      get("_coldMedicineConsults") >= 5 || get("_nextColdMedicineConsult") > totalTurnsPlayed(),
    do: coldMedicineCabinet,
  },
  {
    name: "Trainset",
    ready: () => TrainSet.installed(),
    completed: () => !willRotateTrainset(),
    do: rotateTrainToOptimalCycle,
    limit: { tries: 1 },
  },
  {
    name: "Tune Snapper",
    ready: () => args.familiar === $familiar`Red-Nosed Snapper`,
    completed: () => Snapper.getTrackedPhylum() === $phylum`dude`,
    do: () => Snapper.trackPhylum($phylum`dude`),
  },
  {
    name: "June Cleaver",
    completed: () => !JuneCleaver.have() || !!get("_juneCleaverFightsLeft"),
    do: () =>
      withProperty("recoveryScript", "", () => {
        const target =
          myInebriety() > inebrietyLimit() ? $location`Drunken Stupor` : $location`Noob Cave`;
        adv1(target, -1, "");
      }),
    choices: juneCleaverChoices,
    outfit: { weapon: $item`June cleaver` },
    combat: new GhostStrategy(Macro.abort()),
  },
  {
    name: "Terminal Skills",
    ready: () => SourceTerminal.have(),
    completed: () => SourceTerminal.isCurrentSkill([$skill`Extract`, $skill`Duplicate`]),
    do: () => SourceTerminal.educate([$skill`Extract`, $skill`Duplicate`]),
  },
  {
    name: "Proton Ghost",
    completed: () => get("questPAGhost") === "unstarted",
    ready: () => have($item`protonic accelerator pack`) && !!get("ghostLocation"),
    do: () => get("ghostLocation") ?? abort("Failed to find proper ghost location"),
    outfit: () => combatOutfit({ back: $item`protonic accelerator pack` }),
    combat: new GhostStrategy(() =>
      Macro.trySkill($skill`Shoot Ghost`)
        .trySkill($skill`Shoot Ghost`)
        .trySkill($skill`Shoot Ghost`)
        .trySkill($skill`Trap Ghost`),
    ),
  },
  makeWandererTask(
    "wanderer",
    true,
    {
      name: "Vote Wanderer",
      ready: () =>
        have($item`"I Voted!" sticker`) &&
        totalTurnsPlayed() % 11 === 1 &&
        get("_voteFreeFights") < 3,
      completed: () => get("lastVoteMonsterTurn") === totalTurnsPlayed(),
      combat: new GhostStrategy(),
    },
    $items`"I Voted!" sticker`,
  ),
  makeWandererTask("wanderer", true, {
    name: "Digitize Wanderer",
    completed: () => Counter.get("Digitize") > 0,
    prepare: () =>
      shouldRedigitize() && SourceTerminal.educate([$skill`Digitize`, $skill`Extract`]),
    post: () => get("_sourceTerminalDigitizeMonsterCount") || (_digitizeInitialized = false),
    outfit: digitizeOutfit,
    combat: new GhostStrategy(() => Macro.redigitize().default()),
  }),
  makeWandererTask(
    "wanderer",
    true,
    {
      name: "Void Monster",
      ready: () => have($item`cursed magnifying glass`) && get("cursedMagnifyingGlassCount") === 13,
      completed: () => get("_voidFreeFights") >= 5,
    },
    $items`cursed magnifying glass`,
  ),
  makeWandererTask(
    "wanderer",
    true,
    {
      name: "Kramco",
      ready: () => have($item`Kramco Sausage-o-Matic™`),
      completed: () => getKramcoWandererChance() < 1,
      post: digitizeInitialized,
      combat: new GhostStrategy(),
    },
    $items`Kramco Sausage-o-Matic™`,
  ),
  makeWandererTask("yellow ray", false, {
    name: "Yellow Ray: Fondeluge",
    ready: () => have($skill`Fondeluge`),
    completed: () => have($effect`Everything Looks Yellow`),
    sobriety: "sober",
    post: digitizeInitialized,
    combat: new GhostStrategy(() =>
      Macro.tryHaveSkill($skill`Duplicate`)
        .trySkill($skill`Fondeluge`)
        .abort(),
    ),
  }),
  makeWandererTask(
    "yellow ray",
    false,
    {
      name: "Yellow Ray: Jurassic Parka",
      ready: () => have($item`Jurassic Parka`) && have($skill`Torso Awareness`),
      completed: () => have($effect`Everything Looks Yellow`),
      sobriety: "sober",
      post: digitizeInitialized,
      combat: new GhostStrategy(() =>
        Macro.tryHaveSkill($skill`Duplicate`)
          .trySkill($skill`Spit jurassic acid`)
          .abort(),
      ),
    },
    $items`Jurassic Parka`,
    { parka: "dilophosaur" },
  ),
  makeWandererTask("freefight", false, {
    name: "Free-for-All",
    ready: () => have($skill`Free-For-All`),
    completed: () => have($effect`Everything Looks Red`),
    sobriety: "sober",
    post: digitizeInitialized,
    combat: new GhostStrategy(Macro.skill($skill`Free-For-All`)),
  }),
  {
    name: "Initialize Digitize",
    completed: () => _digitizeInitialized,
    do: (): Location => {
      getRunSource()?.prepare();
      return wanderer().getTarget("backup");
    },
    choices: () => wanderer().getChoices("backup"),
    post: (): void => {
      digitizeInitialized();
      runSource = null;
    },
    outfit: (): Outfit => {
      const run = getRunSource();
      const req = run?.constraints?.equipmentRequirements?.();
      const familiar = run?.constraints?.familiar?.();
      const outfit = new Outfit();
      if (familiar) outfit.equip(familiar);
      if (req) {
        if (req.maximizeParameters) outfit.modifier = req.maximizeParameters;
        for (const item of req.maximizeOptions.forceEquip ?? []) {
          if (!outfit.equip(item)) abort(`Failed to equip item ${item} for free running`);
        }
      }
      return combatOutfit(outfit.spec());
    },
    combat: new GhostStrategy(() => Macro.step(getRunSource()?.macro ?? Macro.abort())),
    sobriety: "sober",
  },
];

export default GLOBAL_TASKS;
