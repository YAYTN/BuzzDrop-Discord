# BuzzDrop for Discord

Right-click a Discord message that contains a **`BZ://`** or **BuzzHeavier** link and choose **Download with BuzzDrop**. BuzzDrop opens and starts the download.

This is a small optional add-on for [BuzzDrop](https://github.com/YAYTN/BuzzDrop). It is a separate project: BuzzDrop works exactly the same without it, and it is not made by or affiliated with Discord, BetterDiscord, Vencord or BuzzHeavier.

## Install (BetterDiscord)

1. Install [BuzzDrop](https://github.com/YAYTN/BuzzDrop/releases/latest) and run it once (that registers `BZ://` links with Windows).
2. Download [`BuzzDropLinks.plugin.js`](https://github.com/YAYTN/BuzzDrop-Discord/releases/latest/download/BuzzDropLinks.plugin.js).
3. In Discord open **Settings → BetterDiscord → Plugins → Open Plugins Folder**, put the file there, and switch **BuzzDropLinks** on.

## Use

Right-click a message that contains a link such as `BZ://h0l6lgmru052` or `https://buzzheavier.com/h0l6lgmru052` and pick **Download with BuzzDrop**. If a message has several links you get **Download N links with BuzzDrop** (up to 10).

- On Windows, if no program is registered for `BZ://` links, the plugin says so and offers BuzzDrop's download page. It never opens anything unless you click the menu item.
- The plugin only reads the text of the message you right-click. It sends nothing anywhere, has no settings, and never touches the network. All it does is ask your computer to open `bz://code`.

## Install (Vencord)

Vencord can't load a plugin from a single file: custom plugins are built into Vencord from its source code. You need [Git](https://git-scm.com), [Node.js](https://nodejs.org) and [pnpm](https://pnpm.io).

1. Install [BuzzDrop](https://github.com/YAYTN/BuzzDrop/releases/latest) and run it once.
2. Get Vencord's source and its dependencies:
   ```
   git clone https://github.com/Vendicated/Vencord.git
   cd Vencord
   pnpm install --frozen-lockfile
   ```
3. Copy this repository's `vencord/buzzDropLinks` folder into `Vencord/src/userplugins/`.
4. Build it and put it into Discord, then restart Discord:
   ```
   pnpm build
   pnpm inject
   ```
5. In Discord open **Settings → Vencord → Plugins**, find **BuzzDropLinks** and switch it on.

This replaces a normal Vencord install with your own build. To go back to the standard one, run `pnpm uninject` and install Vencord with its regular installer. Your own build doesn't update itself: to update, `git pull`, `pnpm install --frozen-lockfile`, `pnpm build`.

The plugin was typechecked and built against Vencord's current source, but a Vencord update can change its plugin interface and break it until the plugin is updated. Vencord's own code is GPL-3.0; so the plugin in the `vencord` folder is GPL-3.0-or-later too (see `vencord/LICENSE`), while the rest of this repository is MIT.

## A fair warning

Discord's rules don't allow client modifications such as BetterDiscord and Vencord. Many people use them anyway, but it's your account and your decision. Discord updates can also break plugins for a while.

## For developers

```
node --test "tests/*.test.*"
```

The tests (Node 24 or newer) check that link detection, in both plugins, gives the same answers as BuzzDrop's own link reader (`tests/fixtures.json` was produced by BuzzDrop's `find_codes`), the menu item, and the hand-over. They don't start Discord.

The BetterDiscord plugin and everything outside the `vencord` folder is MIT licensed. The Vencord plugin is GPL-3.0-or-later.
