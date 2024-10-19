import { Args, getTasks, Quest } from "grimoire-kolmafia";
import { myAdventures, myTurncount, print } from "kolmafia";
import { set } from "libram";
import { get } from "libram/dist/property";
import args from "./args";
import DREAD_NC_TASKS from "./dreadnc";
import GhostEngine from "./engine";
import GLOBAL_TASKS from "./globalTasks";
import { GhostTask, printError, showColorVonnegut } from "./lib";
import { DreadStatusSingleton } from "./raidlog";

function ghostRideOver(): boolean {
  if (get("_ghostrider_abort", "") !== "") {
    set("_ghostrider_abort", "");
    printError("Aborting per request (_ghostrider_abort set)");
    return true;
  }
  return false;
}

export default function main(argstring?: string): void {
  try {
    Args.fill(args, argstring);
  } catch (e: unknown) {
    printError(
      `Don't ask questions. There is no such thing as right and wrong. Except for the arguments you passed to ghostrider, which were wrong:`,
    );
    if (e instanceof Error) {
      printError(e.message);
    } else if (e instanceof String) {
      printError(e.toString());
    } else {
      printError("Unknown error");
    }

    return;
  }
  if (args.help) {
    Args.showHelp(args);
    return;
  }
  if (args.vonnegut) {
    showColorVonnegut();
    return;
  }

  if (args.debug) {
    const dreadstatus = DreadStatusSingleton;
    dreadstatus.update();
    print(`${dreadstatus}`);
    return;
  }
  const runCompleted = () => {
    const turncount = myTurncount();

    return args.turns > 0
      ? () => {
          return ghostRideOver() || myTurncount() - turncount >= args.turns || myAdventures() <= 0;
        }
      : () => {
          return ghostRideOver() || myAdventures() <= -args.turns;
        };
  };

  // Allow re-running after losing a combat
  set("_lastCombatLost", false);

  const quest: Quest<GhostTask> = {
    name: "Can we pay the ghost",
    completed: runCompleted(),
    tasks: [...GLOBAL_TASKS, ...DREAD_NC_TASKS],
  };

  const engine = new GhostEngine(getTasks([quest]));

  try {
    engine.run();
  } catch (e: unknown) {
    printError(`Caught an error doing the ghost ride. Here's the error:`);
    if (e instanceof Error) {
      printError(e.message);
    } else if (e instanceof String || typeof e === "string") {
      printError(e.toString());
    } else {
      printError("...yeah, I dunno.");
      print(typeof e);
      throw e;
    }
  } finally {
    engine.destruct();
  }
}
