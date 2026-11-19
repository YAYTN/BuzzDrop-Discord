/*
 * BuzzDropLinks, a Vencord user plugin
 * Copyright (c) 2026 YAYTN
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { confirmAction } from "@utils/discord";
import definePlugin, { PluginNative } from "@utils/types";
import { Menu, showToast } from "@webpack/common";

import { findCodes } from "./links";

const Native = VencordNative.pluginHelpers.BuzzDropLinks as PluginNative<typeof import("./native")>;

const RELEASES = "https://github.com/YAYTN/BuzzDrop/releases/latest";

async function download(codes: string[]) {
    try {
        const installed = await Native.hasBuzzDrop();
        if (installed === false) {
            confirmAction({
                title: "BuzzDrop isn't installed",
                subtitle: "This link opens in BuzzDrop, a small free app for sending and receiving BuzzHeavier "
                    + "files. It doesn't seem to be installed on this PC yet. Open its download page?",
                confirmText: "Open download page",
                cancelText: "Close",
                onConfirm: () => VencordNative.native.openExternal(RELEASES),
            });
            return;
        }
        const opened = await Native.openLinks(codes);
        if (opened > 0) {
            showToast({ text: opened === 1 ? "Sent to BuzzDrop." : `Sent ${opened} links to BuzzDrop.`, variant: "success" });
        } else {
            showToast({ text: "Couldn't hand the link to BuzzDrop. Copy it and paste it into BuzzDrop instead.", variant: "critical" });
        }
    } catch (err) {
        console.error("[BuzzDropLinks]", err);
        showToast({ text: "Couldn't hand the link to BuzzDrop. Copy it and paste it into BuzzDrop instead.", variant: "critical" });
    }
}

// BuzzDrop's download arrow, drawn like Discord's own menu icons (one colour that follows the text).
function DownloadIcon({ width = 18, height = 18, className }: { width?: number; height?: number; className?: string; }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={width}
            height={height}
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M12 3.5V15M7 10l5 5 5-5M4 15v4h16v-4" />
        </svg>
    );
}

const messageContextMenu: NavContextMenuPatchCallback = (children, props) => {
    try {
        const codes = findCodes(props?.message?.content);
        if (!codes.length) return;
        const label = codes.length === 1 ? "Download with BuzzDrop" : `Download ${codes.length} links with BuzzDrop`;
        children.splice(-1, 0,
            <Menu.MenuGroup>
                <Menu.MenuItem
                    id="buzzdrop-download"
                    label={label}
                    icon={DownloadIcon}
                    leadingAccessory={{ type: "icon", icon: DownloadIcon }}
                    action={() => download(codes)}
                />
            </Menu.MenuGroup>
        );
    } catch (err) {
        console.error("[BuzzDropLinks]", err); // never let a problem here break Discord's own menu
    }
};

export default definePlugin({
    name: "BuzzDropLinks",
    description: "Right-click a message that contains a BZ:// or BuzzHeavier link and choose \"Download with BuzzDrop\".",
    authors: [{ name: "YAYTN", id: 0n }],
    contextMenus: {
        "message": messageContextMenu,
    },
});
