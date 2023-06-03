"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreEvents = exports.Status = void 0;
var Status;
(function (Status) {
    Status["idol"] = "idol";
    Status["failed"] = "failed";
    Status["inProgress"] = "inProgress";
    Status["complete"] = "complete";
})(Status = exports.Status || (exports.Status = {}));
var CoreEvents;
(function (CoreEvents) {
    CoreEvents["start"] = "start";
    CoreEvents["stop"] = "stop";
    CoreEvents["reset"] = "reset";
})(CoreEvents = exports.CoreEvents || (exports.CoreEvents = {}));
