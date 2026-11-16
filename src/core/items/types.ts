export interface BoardItem {
  /** Runtime instance id */
  uid: string;
  itemId: string;
  isPrismatic: boolean;
}

let uidCounter = 0;

export function createBoardItem(itemId: string, isPrismatic = false): BoardItem {
  uidCounter += 1;
  return {
    uid: `i${uidCounter}`,
    itemId,
    isPrismatic,
  };
}

export function resetUidCounter(value = 0): void {
  uidCounter = value;
}
