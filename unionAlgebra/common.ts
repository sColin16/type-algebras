/** Types and functions shared internally and externally */

import { List } from "immutable";

export enum NodeType {
  L = "L",
  A = "A",
  B = "B",
  Union = "Union",
  Mu = "Mu",
  Var = "Var",
}

export type Pair<T> = List<T>
export const pair = <T>(t1: T, t2: T) => {
  return List.of(t1, t2);
};
