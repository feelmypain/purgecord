# Purgecord

**Bulk-delete your own messages in a Discord channel, DM, or across an entire server.**

Purgecord is a [userscript](https://en.wikipedia.org/wiki/Userscript): a single JavaScript file that a browser
extension injects into the Discord web app. It adds a 🗑️ button to Discord's toolbar that opens a panel where you
pick what to delete, and then it walks Discord's own search API deleting matching messages one at a time, respecting
the rate limits the API asks for.

It only ever deletes messages **you** can delete. There is no server, no account, and nothing leaves your browser.

> [!WARNING]
> **Automating a user account is against Discord's Terms of Service** and can get your account terminated
> (see [self-bots](https://support.discord.com/hc/en-us/articles/115002192352-Automated-user-accounts-self-bots-)).
> This tool exists because Discord provides no way to bulk-delete your own history. Use it at your own risk, and
> prefer conservative delays.

> [!CAUTION]
> **Deletion is permanent.** Messages are gone the moment Purgecord deletes them — there is no undo and no recycle
> bin. Request [your data archive](https://support.discord.com/hc/en-us/articles/360004027692) first if you want a
> copy, and use *Streamer mode* + the confirmation preview to check what you are about to erase.

---

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [The panel, field by field](#the-panel-field-by-field)
  - [Author ID](#author-id) · [Server ID](#server-id) · [Channel ID](#channel-id)
  - [Wipe a Discord data archive](#wipe-a-discord-data-archive)
  - [Filter](#filter) · [Pattern](#pattern)
  - [Messages interval](#messages-interval) · [Date interval](#date-interval)
  - [Delays](#delays) · [Authorization Token](#authorization-token)
- [How it works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Building from source](#building-from-source)
- [Credits and license](#credits-and-license)

---

## Install

### 1. Install a userscript manager

Purgecord is not a browser extension itself — it needs a *userscript manager* extension to run it. Pick one:

| Browser | Recommended | Also works |
|---|---|---|
| **Chrome** | [Violentmonkey](https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag) | [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| **Firefox** | [Violentmonkey](https://addons.mozilla.org/firefox/addon/violentmonkey/) | [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/), [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/) |
| **Edge** | [Violentmonkey](https://microsoftedge.microsoft.com/addons/detail/violentmonkey/eeagobfjdenkkddmbclomhiblgggliao) | [Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) |
| **Brave** | [Violentmonkey](https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag) | [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| **Opera** | [Violentmonkey](https://addons.opera.com/extensions/details/violent-monkey/) | [Tampermonkey](https://addons.opera.com/extensions/details/tampermonkey-beta/) |
| **Safari** | [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) | — |

Any of them work. Violentmonkey is open source and is what this project is tested against.

### 2. Install Purgecord

Click the install link — your userscript manager will intercept it and show an install prompt:

### 👉 [**Install Purgecord**](https://raw.githubusercontent.com/feelmypain/purgecord/main/purgecord.user.js) 👈

Review the metadata block it shows you (name, `@match` rules, `@grant none`) and click **Install** / **Confirm
installation**.

<details>
<summary>Manual install, if the link doesn't trigger a prompt</summary>

1. Open [`purgecord.user.js`](https://raw.githubusercontent.com/feelmypain/purgecord/main/purgecord.user.js) and copy
   the whole file.
2. Open your userscript manager's dashboard → **+** / **Create a new script**.
3. Select everything in the editor, paste over it, and save (<kbd>Ctrl</kbd>+<kbd>S</kbd>).

</details>

Updates: the script declares `@updateURL`, so your manager will pick up new versions from this repo automatically.

### 3. Open Discord in a browser

Purgecord runs in the **web app** at [discord.com/channels/@me](https://discord.com/channels/@me) — not the desktop
app. `discord.com`, `ptb.discord.com` and `canary.discord.com` all work.

---

## Quick start

**Delete everything you ever said in one channel:**

1. Open the channel or DM in Discord.
2. Click the 🗑️ button in the top-right toolbar.
3. Click **me** next to *Author ID*, then **current** next to *Channel ID*. Both fields fill themselves in.
4. Click **▶︎ Delete**.
5. Read the confirmation preview carefully, then accept.

The log pane shows every deletion as it happens. **🛑 Stop** halts the run at any point — already-deleted messages
stay deleted; nothing else is touched.

**Delete everything you ever said in a whole server:** same as above, but click **current** next to *Server ID* and
leave *Channel ID* **empty**. Purgecord will search the entire server.

> Leaving *Author ID* empty means "delete every message that matches, regardless of who wrote it". You almost never
> want that — Discord will refuse anything that isn't yours (Purgecord skips those), but it is slow and noisy. Fill
> in *Author ID*.

---

## The panel, field by field

### Author ID

Whose messages to delete. Click **me** to fill in your own user ID.

Leave it empty only if you have *Manage Messages* in the target channel and genuinely want to delete other people's
messages too. Anything you lack permission for is skipped automatically.

### Server ID

Which server to search. Click **current** while viewing the server.

For direct messages this is the literal string `@me`, and *Channel ID* then becomes required.

### Channel ID

Which channel to search.

- **One channel** — paste one ID, or click **current**.
- **Several channels** — paste a comma- or space-separated list. Purgecord runs them as a queue, one after another,
  pausing between each so it doesn't trip the rate limiter.
- **The whole server** — leave it empty (requires *Server ID* to be a real server, not `@me`).

`This is a NSFW channel` must be ticked for age-restricted channels, otherwise Discord's search returns nothing.

### Wipe a Discord data archive

If you [requested your data](https://support.discord.com/hc/en-us/articles/360004027692) from Discord, you can feed
the archive's channel index straight in:

1. Unzip the package Discord emailed you.
2. **Wipe Archive** → choose `messages/index.json`.
3. Purgecord fills *Server ID* with `@me`, *Author ID* with your own, and *Channel ID* with every channel in the
   archive.
4. Press **▶︎ Delete** and leave it running.

This is the practical way to clear years of DMs across dozens of conversations. Channels you have since lost access
to are skipped with a warning and the queue continues.

### Filter

Narrows what counts as a match. These are applied by Discord's search, so they cost nothing:

- **Containing text** — only messages containing this text.
- **has: link** / **has: file** — only messages with a link or an attachment.
- **Include pinned** — off by default, so pinned messages are left alone. Tick it to delete them too.

### Pattern

A JavaScript regular expression, case-insensitive, applied on top of everything else. Only messages whose text
matches are deleted.

Examples:

| Pattern | Matches |
|---|---|
| `^gg$` | messages that are exactly "gg" |
| `https?://` | messages containing a URL |
| `\b(sorry\|oops)\b` | messages containing "sorry" or "oops" |
| `^.{1,3}$` | very short messages |

Purgecord matches against the message text *and* the text of forwarded messages and poll questions, so those aren't
silently missed. A malformed pattern is ignored with a warning rather than deleting everything.

### Messages interval

Deletes only a slice of history, bounded by two message IDs.

- **After a message** — only messages *newer* than this one.
- **Before a message** — only messages *older* than this one.

Click **Pick** and then click any message in the chat to fill the field without hunting for IDs. Press
<kbd>Esc</kbd> to cancel picking.

### Date interval

The same idea with dates instead of message IDs. Both fields need a date **and** a time.

Note: *Messages interval* wins if you fill in both.

### Delays

Two sliders, both in milliseconds:

- **Search delay** (default **2000**) — pause between fetching pages of search results.
- **Delete delay** (default **1000**) — pause between individual deletions.

These are **floors**, not fixed values. When Discord rate-limits the script, Purgecord waits exactly as long as the
API asked, adds a growing backoff on top, and then eases that backoff back down as requests start succeeding again.
Your slider positions are never overwritten; when the script is pacing itself above them, the status bar shows
`(throttled +Nms)`.

Lower is faster but gets rate-limited sooner. If a run is being throttled constantly, raise both rather than
fighting it — being throttled repeatedly is what escalates to a temporary IP block.

### Authorization Token

Your Discord auth token, which Purgecord needs to call the API as you. Click **fill** and it reads it from the page
automatically. You should not have to touch this field.

If auto-detection fails (most often because DevTools is open — Discord hides the token then), close DevTools and
click **fill** again.

> [!CAUTION]
> **Never share this token with anyone.** It grants complete access to your account, bypassing your password and
> 2FA. If you ever paste it somewhere by accident, log out of Discord in that browser immediately, which invalidates
> it. Keep **Streamer mode** on (it is by default) when screenshotting or screen-sharing — it masks the token, IDs
> and message contents in the panel.

---

## How it works

1. **Search.** Purgecord calls the same `/messages/search` endpoint the Discord client uses, with your filters
   applied, sorted newest-first, 25 results per page.
2. **Filter.** System messages Discord refuses to delete (call notices, channel renames, thread starters, …) are
   dropped, along with pinned messages and anything your pattern excludes.
3. **Delete.** Each remaining message is deleted individually, pacing itself against the rate limits.
4. **Page.** The cursor moves to just before the oldest message of the page and searches again. Paging by message ID
   rather than by an offset means deleting messages can't shift the window mid-walk, and there's no ceiling on how
   far back it can go.
5. **Sweep.** When the walk reaches the end having deleted anything, it runs once more — Discord's search index lags
   behind deletions and can hide messages that were there the whole time.

Errors are classified rather than blindly retried. A message that can never be deleted (system message, locked
thread, missing permission) is skipped once with an explanation instead of being retried forever. An expired token
or a block from Discord's edge stops the run immediately, because retrying either one only makes it worse.

**Archived threads are reopened automatically.** Discord does not allow messages to be deleted while their thread
is archived, so Purgecord reopens an unlocked thread when it encounters one and then retries the deletion. Reopening
is visible to other server members, and the thread remains active until Discord archives it again. Locked threads,
or threads you lack permission to reopen, are skipped with an explanation.

---

## Troubleshooting

<details>
<summary><b>The 🗑️ button doesn't appear</b></summary>

First check that the script is actually running: your userscript manager's icon should show `1` on a Discord tab.
If it shows `0`, the `@match` rules didn't fire — make sure you are on `discord.com/channels/...` and not the
desktop app.

If the script is running but the button isn't there, Discord has probably renamed its toolbar CSS classes again.
The panel itself still exists — open it directly from the browser console (<kbd>F12</kbd>):

```js
document.querySelector('#purgecord').style.display = ''
```

Then please [open an issue](https://github.com/feelmypain/purgecord/issues) so the selector can be fixed.

</details>

<details>
<summary><b>"Could not automatically detect Authorization Token"</b></summary>

Close DevTools and click **fill** again. Discord deletes the stored token from local storage while DevTools is open,
as an anti-scam measure.

If you are running Purgecord inside the *desktop* app via a client mod, the stored token is encrypted and cannot be
read — use the web app instead.

</details>

<details>
<summary><b>It says "Being rate limited" over and over</b></summary>

That is the script doing its job — it backs off and keeps going. If it happens constantly, raise both delays. Very
large or very old channels are slow by nature; a channel with tens of thousands of messages takes hours.

</details>

<details>
<summary><b>It stopped and messages are still there</b></summary>

Run it again. Discord's search index can lag well behind reality, and a message it doesn't return can't be deleted.
Purgecord already re-sweeps once at the end, but a second manual run costs nothing.

Check the log for skipped messages too — locked threads, channels you have left, messages posted by someone else, or
threads you lack permission to reopen are reported individually with the reason.

</details>

<details>
<summary><b>"Blocked by Cloudflare"</b></summary>

Too many requests reached Discord's edge and your IP is temporarily blocked — potentially for up to 24 hours. Stop,
wait, and use larger delays next time. Nothing else you do will speed this up.

</details>

<details>
<summary><b>The panel is unreadable / invisible text</b></summary>

Purgecord styles itself with Discord's own theme variables. If Discord renames them, colours can fall back to
nothing. Please [open an issue](https://github.com/feelmypain/purgecord/issues) with a screenshot and your
Discord build.

</details>

---

## Security

You are about to run a third-party script inside a page that is logged into your Discord account. Take that
seriously — with any userscript, including this one:

- **Read the source before you install it.** It is a single readable file, and the `src/` directory here is the
  unminified original. Nothing is obfuscated.
- **Check what it can reach.** The metadata block declares `@grant none` (no privileged userscript APIs) and three
  `@match` rules limited to `discord.com`. It talks to no host other than Discord's own API, which you can verify
  in the Network tab.
- **Install from a source you trust.** Prefer this repo's raw URL over a copy someone pasted elsewhere.

Purgecord has no telemetry, no analytics, and no remote configuration. Your token never leaves the Discord page.

---

## Building from source

Requires Node.js 18+.

```sh
git clone https://github.com/feelmypain/purgecord.git
cd purgecord
npm ci
npm run build      # bundles src/ into purgecord.user.js
npm test           # eslint + build
```

For development, `npm start` runs Rollup in watch mode and serves the built script at
`http://localhost:10001/purgecord.user.js`. Install *that* URL in your userscript manager and it will pick up each
rebuild (it installs under a separate `[DEV]` name so it won't clash with your normal install).

```
src/
├── index.js              entry point
├── purgecord-core.js     search + delete engine, pagination, rate limiting
├── purgecord-ui.js       panel wiring, mounting, logging
├── ui/                   injected markup and styles
└── utils/                token/id lookup, message picker, drag, helpers
```

---

## Credits and license

Purgecord is a fork of **[Undiscord](https://github.com/victornpb/undiscord)** by
[victornpb](https://github.com/victornpb) and its contributors, who wrote the original tool and everything this
project is built on. Full credit to them.

This fork modernizes it for the current Discord web client and API — a rewritten pagination model, corrected
rate-limit handling, updated message-type and error handling, refreshed theme variables and DOM selectors.

Released under the [MIT License](./LICENSE). The original copyright notice and its attribution requirement are
retained, as the licence requires.

#### Disclaimer

> THE SOFTWARE AND ALL INFORMATION HERE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
> INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
> SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
>
> By using any code or information provided here you are agreeing to all parts of the above disclaimer.
