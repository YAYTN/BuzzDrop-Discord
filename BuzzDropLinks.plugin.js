/**
 * @name BuzzDropLinks
 * @author YAYTN
 * @description Right-click a Discord message that contains a BZ:// or BuzzHeavier link and choose "Download with BuzzDrop".
 * @version 1.0.0
 * @source https://github.com/YAYTN/BuzzDrop-Discord
 * @website https://github.com/YAYTN/BuzzDrop
 */

"use strict";

/* ---------------------------------------------------------------------------
 * Finding links. This mirrors how BuzzDrop itself reads links, so the menu item
 * appears exactly when BuzzDrop would understand the message.
 * ------------------------------------------------------------------------- */
const CODE = "[a-z0-9]{8,32}";
// Paths on buzzheavier.com that look like codes but aren't.
const NOT_CODES = new Set([
    "developers", "settings", "register", "dashboard", "password", "download",
    "downloads", "uploads", "account", "privacy", "contact", "pricing", "premium",
    "loginpage", "signup00",
]);
const BZ_RE = new RegExp("\\bbz:/{0,2}[ \\t]*(" + CODE + ")(?![a-z0-9])", "gi");
const URL_RE = new RegExp(
    "\\b(?:https?://)?(?:www\\.)?(?:buzzheavier\\.com|bzzhr\\.co)/(" + CODE + ")(?![a-z0-9])", "gi");
const MAX_TEXT = 20000;
const MAX_LINKS = 10;
const RELEASES = "https://github.com/YAYTN/BuzzDrop/releases/latest";

function findCodes(text) {
    if (typeof text !== "string" || !text || text.length > MAX_TEXT) return [];
    const hits = [];
    for (const rx of [BZ_RE, URL_RE]) {
        rx.lastIndex = 0;
        let m;
        while ((m = rx.exec(text)) !== null) hits.push([m.index, m[1].toLowerCase()]);
    }
    hits.sort((a, b) => a[0] - b[0]);
    const out = [];
    for (const [, code] of hits) {
        if (!out.includes(code) && !NOT_CODES.has(code)) out.push(code);
    }
    return out.slice(0, MAX_LINKS);
}

/* ---------------------------------------------------------------------------
 * The little icon next to the menu text: BuzzDrop's download arrow, drawn like Discord's own menu icons
 * (18px, one colour that follows the text, 2px round strokes).
 * ------------------------------------------------------------------------- */
const ICON_PATH = "M12 3.5V15M7 10l5 5 5-5M4 15v4h16v-4";

function makeIcon() {
    try {
        const React = BdApi.React;
        if (!React || typeof React.createElement !== "function") return undefined;
        return (props) => React.createElement("svg", {
            viewBox: "0 0 24 24",
            width: (props && props.width) || 18,
            height: (props && props.height) || 18,
            className: props && props.className,
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 2,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            "aria-hidden": true,
        }, React.createElement("path", { d: ICON_PATH }));
    } catch (e) {
        return undefined;               // no icon is better than no menu item
    }
}

/* ---------------------------------------------------------------------------
 * Talking to the computer. Kept in one object so the tests can replace it.
 * ------------------------------------------------------------------------- */
const deps = {
    /** Open a URL with the operating system (this is what hands bz://code to BuzzDrop). */
    openExternal(url) {
        try {
            const { shell } = require("electron");
            if (shell && typeof shell.openExternal === "function") {
                shell.openExternal(url);
                return true;
            }
        } catch (e) { /* not available in this Discord build: try the next way */ }
        try {
            window.open(url);
            return true;
        } catch (e) {
            return false;
        }
    },
    /**
     * Is a program registered for bz:// links? Resolves true / false, or null when we can't tell
     * (anything but Windows, or the check itself failed): then we simply try to open the link.
     */
    hasBuzzDrop() {
        return new Promise((resolve) => {
            try {
                if (typeof process === "undefined" || process.platform !== "win32") return resolve(null);
                const { execFile } = require("child_process");
                execFile("reg", ["query", "HKCU\\Software\\Classes\\bz\\shell\\open\\command", "/ve"],
                    { windowsHide: true, timeout: 4000 },
                    (err) => resolve(err ? (err.code === 1 ? false : null) : true));
            } catch (e) {
                resolve(null);
            }
        });
    },
    toast(message, type) {
        try {
            const ui = BdApi.UI && BdApi.UI.showToast ? BdApi.UI : BdApi;
            ui.showToast(message, { type: type || "info" });
        } catch (e) { /* a toast is only a courtesy */ }
    },
    confirm(title, text, confirmText, onConfirm) {
        try {
            BdApi.UI.showConfirmationModal(title, text, { confirmText, cancelText: "Close", onConfirm });
        } catch (e) {
            deps.toast(text, "warning");
        }
    },
};

async function download(codes) {
    const installed = await deps.hasBuzzDrop();
    if (installed === false) {
        deps.confirm(
            "BuzzDrop isn't installed",
            "This link opens in BuzzDrop, a small free app for sending and receiving BuzzHeavier files. "
            + "It doesn't seem to be installed on this PC yet. Open its download page?",
            "Open download page",
            () => deps.openExternal(RELEASES));
        return;
    }
    // BuzzDrop adds every link to the same window; a short gap between them keeps the hand-over orderly.
    codes.forEach((code, i) => setTimeout(() => {
        if (!deps.openExternal("bz://" + code)) {
            deps.toast("Couldn't hand the link to BuzzDrop. Copy it and paste it into BuzzDrop instead.", "error");
        }
    }, i * 600));
    deps.toast(codes.length === 1 ? "Sent to BuzzDrop." : "Sent " + codes.length + " links to BuzzDrop.", "success");
}

/* ---------------------------------------------------------------------------
 * The plugin
 * ------------------------------------------------------------------------- */
module.exports = class BuzzDropLinks {
    start() {
        this.patch = (tree, props) => {
            try {
                const codes = findCodes(props && props.message && props.message.content);
                if (!codes.length || !tree || !tree.props || !Array.isArray(tree.props.children)) return;
                const label = codes.length === 1 ? "Download with BuzzDrop"
                    : "Download " + codes.length + " links with BuzzDrop";
                const item = { type: "text", id: "buzzdrop-download", label, action: () => download(codes) };
                const icon = makeIcon();
                if (icon) item.icon = icon;
                const menu = BdApi.ContextMenu;
                if (typeof menu.buildMenuChildren === "function") {
                    tree.props.children.push(...menu.buildMenuChildren([{ type: "group", items: [item] }]));
                } else {
                    tree.props.children.push(menu.buildItem(item));
                }
            } catch (e) {
                console.error("[BuzzDropLinks]", e);       // never let a problem here break Discord's own menu
            }
        };
        this.unpatch = BdApi.ContextMenu.patch("message", this.patch);
    }

    stop() {
        try {
            if (typeof this.unpatch === "function") this.unpatch();
            else BdApi.ContextMenu.unpatch("message", this.patch);
        } catch (e) { /* already gone */ }
        this.patch = this.unpatch = null;
    }
};

// Handles for the tests (BetterDiscord only looks at the class itself).
module.exports.findCodes = findCodes;
module.exports.makeIcon = makeIcon;
module.exports.ICON_PATH = ICON_PATH;
module.exports.download = download;
module.exports.deps = deps;
