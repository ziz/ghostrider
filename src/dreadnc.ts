import {
  abort,
  availableAmount,
  cliExecute,
  handlingChoice,
  myClass,
  print,
  retrieveItem,
  runChoice,
  totalTurnsPlayed,
  visitUrl,
} from "kolmafia";
import { $class, $item } from "libram";
import { GhostTask } from "./lib";
import { DreadStatusSingleton } from "./raidlog";

const dreadstatus = DreadStatusSingleton;

function updateDreadStatus() {
  if (total_turns_played === totalTurnsPlayed()) return;
  total_turns_played = totalTurnsPlayed();
  dreadstatus.update();
  print(`${dreadstatus}`);
}

let total_turns_played = 0;

function dready(): boolean {
  return dreadstatus.open && dreadstatus.sheets >= 2000;
}
const DREAD_NC_TASKS: GhostTask[] = [
  {
    name: "Dreadsylvania Status",
    ready: () => total_turns_played < totalTurnsPlayed(),
    do: () => {
      updateDreadStatus();
    },
    completed: () => totalTurnsPlayed() === total_turns_played,
  },
  {
    name: "Dread Drunk",
    ready: () => dreadstatus.open && dreadstatus.sheets < 2000,
    do: () => {
      cliExecute("dreaddrunk castle");
      updateDreadStatus();
    },
    completed: () => dreadstatus.sheets >= 2000,
  },
  {
    name: "Time to play some pinball! (Adjusting tilt)",
    ready: dready,
    do: () => {
      // dr dread banish zombies syntax
      cliExecute("dr limit hot|cold|stench|sleaze|spooky ghost");
    },
    completed: () => dreadstatus.monsterBanish["zombie"] >= 2,
  },
  {
    name: "Get some music box parts",
    ready: () => {
      return (
        dready() &&
        (availableAmount($item`Dreadsylvanian skeleton key`) > 0 ||
          availableAmount($item`Freddy Kruegerand`) > 60) &&
        myClass() === $class`Accordion Thief`
      );
    },
    do: () => {
      if (!retrieveItem(1, $item`Dreadsylvanian skeleton key`))
        abort("Failed to get a Dreadsylvanian skeleton key");
      visitUrl(`clan_dreadsylvania.php?action=forceloc&loc=1`); // forest NC
      runChoice(-1);
      if (handlingChoice()) throw "Stuck in choice adventure!";
    },
    choices: {
      721: 3, // forest: attic
      724: 1, // attic: music box parts
    },
    completed: () => "forest.13" in dreadstatus.ncs && dreadstatus.ncs["forest.13"] >= 1,
  },
];

export default DREAD_NC_TASKS;
