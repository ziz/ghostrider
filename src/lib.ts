import { StrictCombatTask } from "grimoire-kolmafia";
import {
  eat,
  fullnessLimit,
  isDarkMode,
  myAdventures,
  myFullness,
  myHp,
  myMaxhp,
  myMaxmp,
  myMp,
  print,
  printHtml,
  restoreHp,
  restoreMp,
} from "kolmafia";
import { $item, get, have, SourceTerminal } from "libram";
import { GhostStrategy } from "./combat";

export function safeRestore(): void {
  if (myHp() < myMaxhp() * 0.5) {
    restoreHp(myMaxhp() * 0.9);
  }
  const mpTarget = Math.min(myMaxmp(), 200);
  if (myMp() < mpTarget) {
    if (
      (have($item`magical sausage`) || have($item`magical sausage casing`)) &&
      get("_sausagesEaten") < 23 &&
      myFullness() <= fullnessLimit()
    ) {
      eat($item`magical sausage`);
    } else restoreMp(mpTarget);
  }
}

export function showColorVonnegut(): void {
  const r = '<span bgcolor="black" color="red">';
  const o = '<span bgcolor="black" color="orange">';
  const y = '<span bgcolor="black" color="yellow">';
  const w = '<span bgcolor="black" color="white">';
  const x = "</span>";

  printHtml(`<pre style="font-family: monospace; white-space: pre; color: orange;">
${r}                          ${x}
${r}   G O D   D A M M I T    ${x}
${r}          .               ${x}
${r}         .M  B A B I E S  ${x}
${r}        ,${o}M${x}M               ${x}
${o}        M${y}M${x}:               ${x}
${r}    .${o}   Y${x}${y}MM${x}${o},${x}              ${x}
${o}    M   'M${y}M${x}M,      ${r},${x}      ${x}
${o}    M.   ${x}${y}\`M${o}M${x}${y}M:${x}    ${o}.M      ${x}
${o}   M${y}M${x},   ,M${y}MM${x}M   ,${y}MM${x}M     ${x}
${r}   "${y}M${x}${o}M${x},  ${o}M${y}MMM${x}M${x}' ,${y}MMM${x}'     ${x}
${o}   ,${y}MM${x}M${y}.MMM${x}M${y}MM${x}M${y}.M${x}MM${y}:${x}      ${x}
${r}   M${y}MMM${x}u${w}/     \\${x}${y}uMM${x}${o}M${x}       ${x}
${o}  ${y}"M${x}M${y}MM${w}( () () )${x}MM${x}"       ${x}
${o}   ""${y}M${x}M${y}M${w}\\  ^  /${x}MM${x}"        ${x}
${o}    "${r}"${x}${y}"M ${w}IIIII${x} M${x}"         ${x}
${o}      "${y}"M${x}m${r}Mm${x}${y}Mm${x}M"          ${x}
${o}                          ${x}
${r} Y O U ' V E  G O T   T O ${x}
${r}     B E  K I N D ! ! !   ${x}
${r}                          ${x}
</pre>`);
}

export function showVonnegut(): void {
  printHtml(`<pre style="font-family: monospace; white-space: pre; color: white; background-color: black;">
                          
   G O D   D A M M I T    
          .               
         .M  B A B I E S  
        ,MM               
        MM:               
    .   YMM,              
    M   'MMM,      ,      
    M.   \`MMM:    .M      
   MM,   ,MMMM   ,MMM     
   "MM,  MMMMM' ,MMM'     
   ,MMM.MMMMMMM.MMM:      
   MMMMu/     \\uMMM       
  "MMMM( () () )MM"       
   ""MMM\\  ^  /MM"        
    """M IIIII M"         
      ""MmMmMmM"          
                          
 Y O U ' V E  G O T   T O 
     B E  K I N D ! ! !   
                          
</pre>`);
}

export function printHighlight(message: string): void {
  const color = isDarkMode() ? "yellow" : "blue";
  print(message, color);
}

export function printError(message: string): void {
  const color = "red";
  print(message, color);
}

export type GhostTask = StrictCombatTask<never, GhostStrategy> & {
  sobriety?: "sober" | "drunk";
};

export const State = {
  blocks: 0,
};

export function shouldRedigitize(): boolean {
  if (!SourceTerminal.have()) return false;
  return (
    myAdventures() * 1.1 <
    SourceTerminal.getDigitizeUsesRemaining() *
      (5 *
        (get("_sourceTerminalDigitizeMonsterCount") *
          (1 + get("_sourceTerminalDigitizeMonsterCount"))) -
        3)
  );
}
