// Tests for the Vencord plugin's pure link logic (run with Node 24 or newer, which reads TypeScript directly).
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { findCodes, validCodes, MAX_LINKS } from "../vencord/buzzDropLinks/links.ts";

const fixtures: Array<{ text: string; codes: string[]; }> = createRequire(import.meta.url)("./fixtures.json");

test("finds exactly the same links as BuzzDrop itself", () => {
    assert.ok(fixtures.length >= 10);
    for (const c of fixtures) {
        assert.deepEqual(findCodes(c.text), c.codes, "for: " + JSON.stringify(c.text));
    }
});

test("the Vencord and BetterDiscord plugins agree with each other", () => {
    const bd = createRequire(import.meta.url)("../BuzzDropLinks.plugin.js");
    for (const c of fixtures) assert.deepEqual(findCodes(c.text), bd.findCodes(c.text));
});

test("ignores things that are not text, and huge messages", () => {
    for (const v of [undefined, null, 42, {}, [], ""]) assert.deepEqual(findCodes(v), []);
    assert.deepEqual(findCodes("bz://abcd1234efgh " + "x".repeat(25000)), []);
});

test("never offers more than ten links", () => {
    const text = Array.from({ length: 30 }, (_, i) => "bz://abcdefg" + String(i).padStart(2, "0") + "xx").join(" ");
    assert.equal(findCodes(text).length, MAX_LINKS);
});

test("the native side only ever opens well-formed codes", () => {
    assert.deepEqual(validCodes(["abcd1234efgh", "ABCD1234EFGH"]), ["abcd1234efgh"]);
    for (const bad of ["short", "has space1234", "bz://abcd1234efgh", "abcd1234efgh/../x", "abcd1234efgh --send C:\\x",
        "abcd1234efgh\n", "a".repeat(33), 5, null, {}]) {
        assert.deepEqual(validCodes([bad]), [], "must refuse " + JSON.stringify(bad));
    }
    for (const notAList of [undefined, null, "abcd1234efgh", { length: 1, 0: "abcd1234efgh" }]) {
        assert.deepEqual(validCodes(notAList), []);
    }
    assert.equal(validCodes(Array(50).fill("abcd1234efgh")).length, MAX_LINKS);
});
