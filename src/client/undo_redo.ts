import { SharedMap } from "fluid-framework";

export type ValueChange = {
	key: string;
	previousValue: any;
	currentValue: any;
};

export class UndoRedoStack {
	private _noteMap: SharedMap | null = null;
	private _undoStack: Stack<Stack<ValueChange>> = new Stack<
		Stack<ValueChange>
	>();
	private _redoStack: Stack<Stack<ValueChange>> = new Stack<
		Stack<ValueChange>
	>();
	private _currUndo: Stack<ValueChange> = new Stack<ValueChange>();
	setNoteMap(NoteMap: SharedMap) {
		this._noteMap = NoteMap;
	}
	redo(): boolean {
		if (this._noteMap != null) {
			const redoAction = this._redoStack.pop();
			if (redoAction == null) {
				return false;
			}

			let nextAction = redoAction.pop();
			let currUndo = new Stack<ValueChange>();
			while (nextAction != null) {
				if (nextAction.currentValue == null) {
					this._noteMap.delete(nextAction.key);
				} else {
					this._noteMap.set(nextAction.key, nextAction.currentValue);
				}
				currUndo.push(nextAction);
				nextAction = redoAction.pop();
			}
			this._undoStack.push(currUndo);
			return true;
		}

		return false;
	}
	undo(): boolean {
		if (this._noteMap != null) {
			const undoAction = this._undoStack.pop();
			if (undoAction == null) {
				return false;
			}

			let nextAction = undoAction.pop();
			let currRedo = new Stack<ValueChange>();
			while (nextAction != null) {
				if (nextAction.previousValue == null) {
					this._noteMap.delete(nextAction.key);
				} else {
					this._noteMap.set(nextAction.key, nextAction.previousValue);
				}
				currRedo.push(nextAction);
				nextAction = undoAction.pop();
			}
			this._redoStack.push(currRedo);
			return true;
		}

		return false;
	}
	push(val: ValueChange) {
		this._currUndo.push(val);
	}
	finish() {
		this._undoStack.push(new Stack<ValueChange>(this._currUndo));
		this._redoStack.clear();
		this._currUndo.clear();
	}
}

class Stack<T> {
	private _store: T[] = [];
	constructor(stack?: Stack<T>) {
		if (stack != null) {
			this._store = stack._store.slice();
		}
	}
	push(val: T) {
		this._store.push(val);
	}
	pop(): T | undefined {
		return this._store.pop();
	}
	clear() {
		this._store = [];
	}
}
