"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_data_1 = require("../../test-data");
const helpers_1 = require("../../tests/helpers");
const _1 = require("./");
describe("extract", () => {
    test_data_1.default.forEach((t) => {
        it(t.name, () => __awaiter(this, void 0, void 0, function* () {
            const binarizedImage = yield helpers_1.loadBinarized(t.binarizedPath);
            const expectedOutput = t.extractedPath ? yield helpers_1.loadBinarized(t.extractedPath) : null;
            let output = null;
            try {
                output = _1.extract(binarizedImage, t.location).matrix;
            }
            catch (e) {
                // error
            }
            expect(output).toEqual(expectedOutput);
        }));
    });
});
