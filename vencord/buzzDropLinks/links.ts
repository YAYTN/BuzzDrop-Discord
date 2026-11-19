/*
 * BuzzDropLinks, a Vencord user plugin
 * Copyright (c) 2026 YAYTN
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Pure functions only (no Discord, no Electron), so they can be tested on their own.

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
const VALID_CODE = new RegExp("^" + CODE + "$");

export const MAX_TEXT = 20000;
export const MAX_LINKS = 10;

/** Every BuzzHeavier code linked in a message (BZ://… or a URL), in order, without repeats. Same rules as BuzzDrop. */
export function findCodes(text: unknown): string[] {
    if (typeof text !== "string" || !text || text.length > MAX_TEXT) return [];
    const hits: Array<[number, string]> = [];
    for (const rx of [BZ_RE, URL_RE]) {
        rx.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = rx.exec(text)) !== null) hits.push([m.index, m[1].toLowerCase()]);
    }
    hits.sort((a, b) => a[0] - b[0]);
    const out: string[] = [];
    for (const [, code] of hits) {
        if (!out.includes(code) && !NOT_CODES.has(code)) out.push(code);
    }
    return out.slice(0, MAX_LINKS);
}

/** What the native side is willing to open: only well-formed codes, at most MAX_LINKS of them. */
export function validCodes(codes: unknown): string[] {
    if (!Array.isArray(codes)) return [];
    return codes.filter((c): c is string => typeof c === "string" && VALID_CODE.test(c)).slice(0, MAX_LINKS);
}
