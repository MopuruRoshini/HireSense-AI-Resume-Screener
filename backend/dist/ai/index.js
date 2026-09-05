"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIProvider = getAIProvider;
const gemini_provider_1 = require("./gemini.provider");
const config_1 = require("../config");
let _provider = null;
function getAIProvider() {
    if (!_provider) {
        switch (config_1.config.ai.provider) {
            case 'gemini':
            default:
                _provider = new gemini_provider_1.GeminiProvider();
        }
    }
    return _provider;
}
__exportStar(require("./provider.interface"), exports);
//# sourceMappingURL=index.js.map