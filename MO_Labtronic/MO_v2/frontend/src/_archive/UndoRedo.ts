export class UndoRedo<T> {
  private currentState: T | null = null;
  private undoStack: T[] = [];
  private redoStack: T[] = [];

  intiate(state: T) {
    this.undoStack = [];
    this.redoStack = [];
    this.currentState = this.copy(state);
  }

  record(state: T) {
    if (this.currentState) {
      const _state = this.copy(this.currentState);
      this.undoStack = [];
      this.undoStack.push(_state);
    }
    this.currentState = this.copy(state);
  }
  undo() {
    if (!this.canUndo()) return undefined;
    const lastState = this.undoStack.pop() as T;
    this.redoStack.push(this.copy(this.currentState));
    this.currentState =this.copy(lastState);
    return this.copy(lastState);
  }
  redo() {
    if (!this.canRedo()) return undefined;
    const lastState = this.redoStack.pop() as T;
    this.undoStack.push(this.copy(this.currentState));
    this.currentState = this.copy(lastState);
    return this.copy(lastState);
  }
  canUndo() {
    return this.undoStack.length > 0;
  }
  canRedo() {
    return this.redoStack.length > 0;
  }
  logStatus() {

  }
  copy(state: T | null) {
    return JSON.parse(JSON.stringify(state));
  }
  getCurrentStateCopy() {
    return this.copy(this.currentState);
  }
}
