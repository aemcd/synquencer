"use strict";
exports.__esModule = true;
var fluid = require("@/pages/sequencer/fluid");
var types_1 = require("@/server/types");
var undo_redo_1 = require("@/client/undo_redo");
function checkContainers() {
    for (var i = 1; i < allContainers.length; i++) {
        var notes1 = allContainers[i].container.initialObjects.sequence;
        var notes2 = allContainers[i - 1].container.initialObjects.sequence;
        if (notes1.entries() != notes2.entries()) {
            console.log('Containers %d and %d do not match!', i - 1, i);
        }
    }
}
var n = 10;
var undoRedoHandler = new undo_redo_1.UndoRedoStack();
var allContainers = new Array(n);
var _loop_1 = function (i) {
    fluid.getFluidData().then(function (data) { allContainers[i] = data; });
};
for (var i = 0; i < n; i++) {
    _loop_1(i);
}
for (var i = 0; i < n; i++) {
    var container = allContainers[i].container;
    var note = new types_1.Note({ location: 0, velocity: 0, duration: 0, pitch: 0, instrument: types_1.instrumentList.Piano });
    fluid.addNoteCallback(note, container.initialObjects, undoRedoHandler);
    checkContainers();
    undoRedoHandler.undo();
    checkContainers();
    undoRedoHandler.redo();
    checkContainers();
}
