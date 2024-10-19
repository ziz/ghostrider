import { makeValue, ValueFunctions } from "garbo-lib";
import { Item } from "kolmafia";

import { $item } from "libram";

let _valueFunctions: ValueFunctions | undefined = undefined;
function ghostValueFunctions(): ValueFunctions {
  if (!_valueFunctions) {
    _valueFunctions = makeValue({
      itemValues: new Map([[$item`fake hand`, 50000]]),
    });
  }
  return _valueFunctions;
}

export function ghostValue(item: Item, useHistorical = false): number {
  return ghostValueFunctions().value(item, useHistorical);
}

export function ghostAverageValue(...items: Item[]): number {
  return ghostValueFunctions().averageValue(...items);
}
