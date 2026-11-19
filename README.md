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

## Vencord

A Vencord version is planned. Vencord plugins have to be built into Vencord from source, so it will be a "user plugin" folder rather than a single file.

## A fair warning

Discord's rules don't allow client modifications such as BetterDiscord and Vencord. Many people use them anyway, but it's your account and your decision. Discord updates can also break plugins for a while.

## For developers

```
node --test tests/
```

The tests check that link detection gives the same answers as BuzzDrop's own link reader (`tests/fixtures.json` was produced by BuzzDrop's `find_codes`), the menu item, and the hand-over. They don't start Discord.

MIT licensed.
