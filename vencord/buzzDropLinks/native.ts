/*
 * BuzzDropLinks, a Vencord user plugin
 * Copyright (c) 2026 YAYTN
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Runs in Discord's main process (Vencord's "native" side). It can do exactly two things:
//  - open `bz://<code>` for a code that looks like a BuzzHeavier code (so the plugin can never be used to
//    open anything else), and
//  - ask Windows whether a program is registered for bz:// links.

import { execFile } from "child_process";
import { IpcMainInvokeEvent, shell } from "electron";

import { validCodes } from "./links";

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** Opens bz://<code> for each valid code, a short moment apart. Resolves with how many were opened. */
export async function openLinks(_: IpcMainInvokeEvent, codes: string[]): Promise<number> {
    const valid = validCodes(codes);
    let opened = 0;
    for (const [i, code] of valid.entries()) {
        if (i) await sleep(600);
        try {
            await shell.openExternal("bz://" + code);
            opened++;
        } catch {
            // that one could not be opened; carry on with the others
        }
    }
    return opened;
}

/**
 * Is a program registered for bz:// links? true / false, or null when it can't be told (not Windows, or the
 * check itself failed): then the plugin simply tries to open the link.
 */
export function hasBuzzDrop(_: IpcMainInvokeEvent): Promise<boolean | null> {
    return new Promise(resolve => {
        if (process.platform !== "win32") return resolve(null);
        try {
            execFile("reg", ["query", "HKCU\\Software\\Classes\\bz\\shell\\open\\command", "/ve"],
                { windowsHide: true, timeout: 4000 },
                err => {
                    if (!err) return resolve(true);
                    // `reg query` exits with 1 when the key doesn't exist: nobody is registered for bz://
                    resolve((err as { code?: unknown; }).code === 1 ? false : null);
                });
        } catch {
            resolve(null);
        }
    });
}
