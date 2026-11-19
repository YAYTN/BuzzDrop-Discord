"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const Plugin = require(path.join(__dirname, "..", "BuzzDropLinks.plugin.js"));
const { findCodes, download, deps } = Plugin;

// --- the link reader must agree with BuzzDrop's own (tests/fixtures.json is made by BuzzDrop's find_codes) ---
test("finds exactly the same links as BuzzDrop itself", () => {
    const cases = require("./fixtures.json");
    assert.ok(cases.length >= 10);
    for (const c of cases) {
        assert.deepEqual(findCodes(c.text), c.codes, "for: " + JSON.stringify(c.text));
    }
});

test("ignores things that are not text, and huge messages", () => {
    for (const v of [undefined, null, 42, {}, [], ""]) assert.deepEqual(findCodes(v), []);
    assert.deepEqual(findCodes("bz://abcd1234efgh " + "x".repeat(25000)), []);
});

test("never offers more than ten links", () => {
    const text = Array.from({ length: 30 }, (_, i) => "bz://abcdefg" + String(i).padStart(2, "0") + "xx").join(" ");
    assert.equal(findCodes(text).length, 10);
});

// --- the menu ---
function fakeDiscord() {
    const calls = { patched: [], unpatched: 0 };
    global.BdApi = {
        ContextMenu: {
            patch(name, cb) { calls.patched.push([name, cb]); return () => { calls.unpatched++; }; },
            buildMenuChildren(setup) { return setup.map((g) => ({ group: g.items.map((i) => i) })); },
        },
        UI: { showToast() {}, showConfirmationModal() {} },
    };
    return calls;
}

test("adds one menu item on a message with a link, none otherwise, and removes itself on stop", () => {
    const calls = fakeDiscord();
    const p = new Plugin();
    p.start();
    assert.equal(calls.patched.length, 1);
    assert.equal(calls.patched[0][0], "message");
    const patch = calls.patched[0][1];

    const withLink = { props: { children: [] } };
    patch(withLink, { message: { content: "grab it: BZ://h0l6lgmru052" } });
    assert.equal(withLink.props.children.length, 1);
    const item = withLink.props.children[0].group[0];
    assert.equal(item.label, "Download with BuzzDrop");

    const many = { props: { children: [] } };
    patch(many, { message: { content: "bz://aaaa1111bbbb https://buzzheavier.com/cccc2222dddd" } });
    assert.equal(many.props.children[0].group[0].label, "Download 2 links with BuzzDrop");

    const plain = { props: { children: [] } };
    patch(plain, { message: { content: "hello there" } });
    assert.equal(plain.props.children.length, 0);

    for (const odd of [{}, { message: {} }, undefined]) {      // odd menus must never throw or change anything
        const t = { props: { children: [] } };
        assert.doesNotThrow(() => patch(t, odd));
        assert.equal(t.props.children.length, 0);
    }
    assert.doesNotThrow(() => patch(null, { message: { content: "bz://abcd1234efgh" } }));
    assert.doesNotThrow(() => patch({ props: {} }, { message: { content: "bz://abcd1234efgh" } }));

    p.stop();
    assert.equal(calls.unpatched, 1);
    assert.doesNotThrow(() => p.stop());                       // stopping twice is harmless
});

// --- the hand-over ---
function withDeps(overrides, fn) {
    const saved = { ...deps };
    Object.assign(deps, overrides);
    return Promise.resolve(fn()).finally(() => Object.assign(deps, saved));
}

test("hands each link to the operating system as bz://code", async () => {
    const opened = [], toasts = [];
    await withDeps({
        hasBuzzDrop: async () => true,
        openExternal: (u) => { opened.push(u); return true; },
        toast: (m, t) => toasts.push([m, t]),
    }, async () => {
        await download(["aaaa1111bbbb", "cccc2222dddd"]);
        await new Promise((r) => setTimeout(r, 1500));
    });
    assert.deepEqual(opened, ["bz://aaaa1111bbbb", "bz://cccc2222dddd"]);
    assert.equal(toasts[0][1], "success");
});

test("if BuzzDrop is not installed it offers the download page and opens nothing", async () => {
    const opened = [], asked = [];
    await withDeps({
        hasBuzzDrop: async () => false,
        openExternal: (u) => { opened.push(u); return true; },
        confirm: (title, text, label, onConfirm) => asked.push({ title, label, onConfirm }),
        toast: () => {},
    }, async () => {
        await download(["aaaa1111bbbb"]);
        assert.deepEqual(opened, []);
        assert.equal(asked.length, 1);
        assert.match(asked[0].title, /isn't installed/);
        asked[0].onConfirm();                                  // "Open download page"
        assert.deepEqual(opened, ["https://github.com/YAYTN/BuzzDrop/releases/latest"]);
    });
});

test("when it can't tell whether BuzzDrop is installed it just tries", async () => {
    const opened = [];
    await withDeps({
        hasBuzzDrop: async () => null,
        openExternal: (u) => { opened.push(u); return true; },
        toast: () => {},
    }, async () => { await download(["aaaa1111bbbb"]); await new Promise((r) => setTimeout(r, 100)); });
    assert.deepEqual(opened, ["bz://aaaa1111bbbb"]);
});

test("a failed hand-over is explained, not silent", async () => {
    const toasts = [];
    await withDeps({
        hasBuzzDrop: async () => true,
        openExternal: () => false,
        toast: (m, t) => toasts.push([m, t]),
    }, async () => { await download(["aaaa1111bbbb"]); await new Promise((r) => setTimeout(r, 100)); });
    assert.ok(toasts.some(([m, t]) => t === "error" && /paste it into BuzzDrop/.test(m)));
});
