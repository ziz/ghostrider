import { Args } from "grimoire-kolmafia";
import { myFamiliar } from "kolmafia";

const args = Args.create(
  "ghostrider",
  "A script that will not steal the Declaration of Independence but will take Mayor Ghost's face off for you",
  {
    turns: Args.number({
      help: "The number of turns to run (use negative numbers for the number of turns remaining)",
      default: Infinity,
    }),
    debug: Args.flag({
      help: "Turn on debug printing",
      default: false,
    }),
    familiar: Args.familiar({
      help: "The familiar to use for combats",
      setting: "ghostrider_familiar",
      default: myFamiliar(),
    }),

    vonnegut: Args.flag({
      help: "Display a really important message",
      default: false,
    }),
  },
  { positionalArgs: ["turns"] },
);

export default args;
