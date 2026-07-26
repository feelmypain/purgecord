// ==UserScript==
// @name        Purgecord
// @description Bulk-delete your own messages in a Discord channel, DM or server
// @version     1.0.0
// @author      feelmypain
// @homepageURL https://github.com/feelmypain/purgecord
// @supportURL  https://github.com/feelmypain/purgecord/issues
// @match       https://*.discord.com/app
// @match       https://*.discord.com/channels/*
// @match       https://*.discord.com/login
// @license     MIT
// @namespace   https://github.com/feelmypain/purgecord
// @icon        https://raw.githubusercontent.com/feelmypain/purgecord/main/images/icon128.png
// @downloadURL https://raw.githubusercontent.com/feelmypain/purgecord/main/purgecord.user.js
// @grant       none
// @attribution Fork of Undiscord by victornpb (https://github.com/victornpb/undiscord), MIT
// @updateURL   https://raw.githubusercontent.com/feelmypain/purgecord/main/purgecord.user.js
// ==/UserScript==
(function () {
	'use strict';

	/* rollup-plugin-baked-env */
	const VERSION = "1.0.0";

	var themeCss = (`
/* purgecord window */
#purgecord.browser { box-shadow: var(--shadow-border), var(--shadow-high); border: 1px solid var(--border-subtle); overflow: hidden; }
#purgecord.container,
#purgecord .container { background-color: var(--background-surface-high); border-radius: 8px; box-sizing: border-box; cursor: default; flex-direction: column; }
#purgecord .header { background-color: var(--background-base-lowest, var(--background-tertiary)); height: 48px; align-items: center; min-height: 48px; padding: 0 16px; display: flex; color: var(--text-subtle, var(--header-secondary)); cursor: grab; }
#purgecord .header .icon { color: var(--interactive-icon-default, var(--interactive-normal)); margin-right: 8px; flex-shrink: 0; width: 24; height: 24; }
#purgecord .header .icon:hover { color: var(--interactive-icon-hover, var(--interactive-hover)); }
#purgecord .header h3 { font-size: 16px; line-height: 20px; font-weight: 500; font-family: var(--font-display); color: var(--text-strong, var(--header-primary)); flex-shrink: 0; margin-right: 16px; }
#purgecord .spacer { flex-grow: 1; }
#purgecord .header .vert-divider { width: 1px; height: 24px; background-color: var(--border-subtle, var(--background-modifier-accent)); margin-right: 16px; flex-shrink: 0; }
#purgecord legend,
#purgecord label { color: var(--text-subtle, var(--header-secondary)); font-size: 12px; line-height: 16px; font-weight: 500; text-transform: uppercase; cursor: default; font-family: var(--font-display); margin-bottom: 8px; }
#purgecord .multiInput { display: flex; align-items: center; font-size: 16px; box-sizing: border-box; width: 100%; border-radius: 3px; color: var(--text-default); background-color: var(--input-background-default, var(--input-background)); border: none; transition: border-color 0.2s ease-in-out 0s; }
#purgecord .multiInput :first-child { flex-grow: 1; }
#purgecord .multiInput button:last-child { margin-right: 4px; }
#purgecord .input { font-size: 16px; width: 100%; transition: border-color 0.2s ease-in-out 0s; padding: 10px; height: 44px; background-color: var(--input-background-default, var(--input-background)); border: 1px solid var(--input-border-default, var(--input-border)); border-radius: 8px; box-sizing: border-box; color: var(--text-default); }
#purgecord fieldset { margin-top: 16px; }
#purgecord .input-wrapper { display: flex; align-items: center; font-size: 16px; box-sizing: border-box; width: 100%; border-radius: 3px; color: var(--text-default); background-color: var(--input-background-default, var(--input-background)); border: none; transition: border-color 0.2s ease-in-out 0s; }
#purgecord input[type="text"],
#purgecord input[type="search"],
#purgecord input[type="password"],
#purgecord input[type="datetime-local"],
#purgecord input[type="number"],
#purgecord input[type="range"] { background-color: var(--input-background-default, var(--input-background)); border: 1px solid var(--input-border-default, var(--input-border)); border-radius: 8px; box-sizing: border-box; color: var(--text-default); font-size: 16px; height: 44px; padding: 12px 10px; transition: border-color .2s ease-in-out; width: 100%; }
#purgecord .divider,
#purgecord hr { border: none; margin-bottom: 24px; padding-bottom: 4px; border-bottom: 1px solid var(--border-subtle, var(--background-modifier-accent)); }
#purgecord .sectionDescription { margin-bottom: 16px; color: var(--text-subtle, var(--header-secondary)); font-size: 14px; line-height: 20px; font-weight: 400; }
#purgecord a { color: var(--text-link); text-decoration: none; }
#purgecord .btn,
#purgecord button { position: relative; display: flex; -webkit-box-pack: center; justify-content: center; -webkit-box-align: center; align-items: center; box-sizing: border-box; background: none; border: none; border-radius: 3px; font-size: 14px; font-weight: 500; line-height: 16px; padding: 2px 16px; user-select: none; /* sizeSmall */     width: 60px; height: 32px; min-width: 60px; min-height: 32px; /* lookFilled colorPrimary */     color: rgb(255, 255, 255); background-color: var(--control-secondary-background-default, var(--button-secondary-background)); }
#purgecord .sizeMedium { width: 96px; height: 38px; min-width: 96px; min-height: 38px; }
#purgecord .sizeMedium.icon { width: 38px; min-width: 38px; }
#purgecord sup { vertical-align: top; }
/* lookFilled colorPrimary */
#purgecord .accent { background-color: var(--background-brand, var(--brand-experiment)); }
#purgecord .danger { background-color: var(--control-critical-primary-background-default, var(--button-danger-background)); }
#purgecord .positive { background-color: var(--control-expressive-background-default, var(--button-positive-background)); }
#purgecord .info { font-size: 12px; line-height: 16px; padding: 8px 10px; color: var(--text-muted); }
/* Scrollbar */
#purgecord .scroll::-webkit-scrollbar { width: 8px; height: 8px; }
#purgecord .scroll::-webkit-scrollbar-corner { background-color: transparent; }
#purgecord .scroll::-webkit-scrollbar-thumb { background-clip: padding-box; border: 2px solid transparent; border-radius: 4px; background-color: var(--scrollbar-thin-thumb); min-height: 40px; }
#purgecord .scroll::-webkit-scrollbar-track { border-color: var(--scrollbar-thin-track); background-color: var(--scrollbar-thin-track); border: 2px solid var(--scrollbar-thin-track); }
/* fade scrollbar */
#purgecord .scroll::-webkit-scrollbar-thumb,
#purgecord .scroll::-webkit-scrollbar-track { visibility: hidden; }
#purgecord .scroll:hover::-webkit-scrollbar-thumb,
#purgecord .scroll:hover::-webkit-scrollbar-track { visibility: visible; }
/**** functional classes ****/
#purgecord.redact .priv { display: none !important; }
#purgecord.redact x:not(:active) { color: transparent !important; background-color: var(--primary-700) !important; cursor: default; user-select: none; }
#purgecord.redact x:hover { position: relative; }
#purgecord.redact x:hover::after { content: "Redacted information (Streamer mode: ON)"; position: absolute; display: inline-block; top: -32px; left: -20px; padding: 4px; width: 150px; font-size: 8pt; text-align: center; white-space: pre-wrap; background-color: var(--background-surface-high, var(--background-floating)); -webkit-box-shadow: var(--elevation-high); box-shadow: var(--elevation-high); color: var(--text-default); border-radius: 5px; pointer-events: none; }
#purgecord.redact [priv] { -webkit-text-security: disc !important; }
#purgecord :disabled { display: none; }
/**** layout and utility classes ****/
#purgecord,
#purgecord * { box-sizing: border-box; }
#purgecord .col { display: flex; flex-direction: column; }
#purgecord .row { display: flex; flex-direction: row; align-items: center; }
#purgecord .mb1 { margin-bottom: 8px; }
#purgecord .log { margin-bottom: 0.25em; }
#purgecord .log-debug { color: inherit; }
#purgecord .log-info { color: #00b0f4; }
#purgecord .log-verb { color: #72767d; }
#purgecord .log-warn { color: #faa61a; }
#purgecord .log-error { color: #f04747; }
#purgecord .log-success { color: #43b581; }
`);

	var mainCss = (`
/**** Purgecord Button ****/
#purgecord-btn { position: relative; width: auto; height: 24px; margin: 0 8px; cursor: pointer; color: var(--interactive-icon-default, var(--interactive-normal)); flex: 0 0 auto; }
#purgecord-btn progress { position: absolute; top: 23px; left: -4px; width: 32px; height: 12px; display: none; }
#purgecord-btn.running { color: var(--control-critical-primary-background-default, var(--button-danger-background)) !important; }
#purgecord-btn.running progress { display: block; }
/**** Purgecord Interface ****/
#purgecord { position: fixed; z-index: 100; top: 58px; right: 10px; display: flex; flex-direction: column; width: 800px; height: 80vh; min-width: 610px; max-width: 100vw; min-height: 448px; max-height: 100vh; color: var(--text-default, var(--text-normal)); border-radius: 4px; background-color: var(--background-base-low, var(--background-secondary)); box-shadow: var(--elevation-stroke), var(--elevation-high); will-change: top, left, width, height; }
#purgecord .header .icon { cursor: pointer; }
#purgecord .window-body { height: calc(100% - 48px); }
#purgecord .sidebar { overflow: hidden scroll; overflow-y: auto; width: 270px; min-width: 250px; height: 100%; max-height: 100%; padding: 8px; background: var(--bg-overlay-4, var(--background-base-lowest)); }
#purgecord .sidebar legend,
#purgecord .sidebar label { display: block; width: 100%; }
#purgecord .main { display: flex; max-width: calc(100% - 250px); background-color: var(--bg-overlay-chat, var(--background-base-lower)); flex-grow: 1; }
#purgecord.hide-sidebar .sidebar { display: none; }
#purgecord.hide-sidebar .main { max-width: 100%; }
#purgecord #logArea { font-family: Consolas, Liberation Mono, Menlo, Courier, monospace; font-size: 0.75rem; overflow: auto; padding: 10px; user-select: text; flex-grow: 1; flex-grow: 1; cursor: auto; }
#purgecord .tbar { padding: 8px; background-color: var(--bg-overlay-2, var(--__header-bar-background)); }
#purgecord .tbar button { margin-right: 4px; margin-bottom: 4px; }
#purgecord .footer { cursor: se-resize; padding-right: 30px; }
#purgecord .footer #progressPercent { padding: 0 1em; font-size: small; color: var(--interactive-muted); flex-grow: 1; }
.resize-handle { position: absolute; bottom: -15px; right: -15px; width: 30px; height: 30px; transform: rotate(-45deg); background: repeating-linear-gradient(0, var(--border-subtle, var(--background-modifier-accent)), var(--border-subtle, var(--background-modifier-accent)) 1px, transparent 2px, transparent 4px); cursor: nwse-resize; }
/**** Elements ****/
#purgecord summary { font-size: 16px; font-weight: 500; line-height: 20px; position: relative; overflow: hidden; margin-bottom: 2px; padding: 6px 10px; cursor: pointer; white-space: nowrap; text-overflow: ellipsis; color: var(--interactive-icon-default, var(--interactive-normal)); border-radius: 4px; flex-shrink: 0; }
#purgecord fieldset { padding-left: 8px; }
#purgecord legend a { float: right; text-transform: initial; }
#purgecord progress { height: 8px; margin-top: 4px; flex-grow: 1; }
#purgecord .importJson { display: flex; flex-direction: row; }
#purgecord .importJson button { margin-left: 5px; width: fit-content; }
`);

	var dragCss = (`
[name^="grab-"] { position: absolute; --size: 6px; --corner-size: 16px; --offset: -1px; z-index: 9; }
[name^="grab-"]:hover{ background: rgba(128,128,128,0.1); }
[name="grab-t"] { top: 0px; left: var(--corner-size); right: var(--corner-size); height: var(--size); margin-top: var(--offset); cursor: ns-resize; }
[name="grab-r"] { top: var(--corner-size); bottom: var(--corner-size); right: 0px; width: var(--size); margin-right: var(--offset); 
  cursor: ew-resize; }
[name="grab-b"] { bottom: 0px; left: var(--corner-size); right: var(--corner-size); height: var(--size); margin-bottom: var(--offset); cursor: ns-resize; }
[name="grab-l"] { top: var(--corner-size); bottom: var(--corner-size); left: 0px; width: var(--size); margin-left: var(--offset); cursor: ew-resize; }
[name="grab-tl"] { top: 0px; left: 0px; width: var(--corner-size); height: var(--corner-size); margin-top: var(--offset); margin-left: var(--offset); cursor: nwse-resize; }
[name="grab-tr"] { top: 0px; right: 0px; width: var(--corner-size); height: var(--corner-size); margin-top: var(--offset); margin-right: var(--offset); cursor: nesw-resize; }
[name="grab-br"] { bottom: 0px; right: 0px; width: var(--corner-size); height: var(--corner-size); margin-bottom: var(--offset); margin-right: var(--offset); cursor: nwse-resize; }
[name="grab-bl"] { bottom: 0px; left: 0px; width: var(--corner-size); height: var(--corner-size); margin-bottom: var(--offset); margin-left: var(--offset); cursor: nesw-resize; }
`);

	var buttonHtml = (`
<div id="purgecord-btn" tabindex="0" role="button" aria-label="Delete Messages" title="Delete Messages with Purgecord">
    <svg aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
        <path fill="currentColor" d="M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z"></path>
        <path fill="currentColor" d="M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z"></path>
    </svg>
    <progress></progress>
</div>
`);

	var purgecordTemplate = (`
<div id="purgecord" class="browser container redact" style="display:none;">
    <div class="header">
        <svg class="icon" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z"></path>
            <path fill="currentColor"
                d="M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z">
            </path>
        </svg>
        <h3>Purgecord</h3>
        <div class="vert-divider"></div>
        <span> Bulk delete messages</span>
        <div class="spacer"></div>
        <div id="hide" class="icon" aria-label="Close" role="button" tabindex="0">
            <svg aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor"
                    d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z">
                </path>
            </svg>
        </div>
    </div>
    <div class="window-body" style="display: flex; flex-direction: row;">
        <div class="sidebar scroll">
            <details open>
                <summary>General</summary>
                <fieldset>
                    <legend>
                        Author ID
                        <a href="{{WIKI}}#author-id" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="multiInput">
                        <div class="input-wrapper">
                            <input class="input" id="authorId" type="text" priv>
                        </div>
                        <button id="getAuthor">me</button>
                    </div>
                </fieldset>
                <hr>
                <fieldset>
                    <legend>
                        Server ID
                        <a href="{{WIKI}}#server-id" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="multiInput">
                        <div class="input-wrapper">
                            <input class="input" id="guildId" type="text" priv>
                        </div>
                        <button id="getGuild">current</button>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        Channel ID
                        <a href="{{WIKI}}#channel-id" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="multiInput mb1">
                        <div class="input-wrapper">
                            <input class="input" id="channelId" type="text" priv>
                        </div>
                        <button id="getChannel">current</button>
                    </div>
                    <div class="sectionDescription">
                        <label class="row"><input id="includeNsfw" type="checkbox">This is a NSFW channel</label>
                    </div>
                </fieldset>
            </details>
            <details>
                <summary>Wipe Archive</summary>
                <fieldset>
                    <legend>
                        Import index.json
                        <a href="{{WIKI}}#wipe-a-discord-data-archive" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="input-wrapper">
                        <input type="file" id="importJsonInput" accept="application/json,.json" style="width:100%";>
                    </div>
                    <div class="sectionDescription">
                        <br>
                        After requesting your data from discord, you can import it here.<br>
                        Select the "messages/index.json" file from the discord archive.
                    </div>
                </fieldset>
            </details>
            <hr>
            <details>
                <summary>Filter</summary>
                <fieldset>
                    <legend>
                        Search
                        <a href="{{WIKI}}#filter" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="input-wrapper">
                        <input id="search" type="text" placeholder="Containing text" priv>
                    </div>
                    <div class="sectionDescription">
                        Only delete messages that contain the text
                    </div>
                    <div class="sectionDescription">
                        <label><input id="hasLink" type="checkbox">has: link</label>
                    </div>
                    <div class="sectionDescription">
                        <label><input id="hasFile" type="checkbox">has: file</label>
                    </div>
                    <div class="sectionDescription">
                        <label><input id="includePinned" type="checkbox">Include pinned</label>
                    </div>
                </fieldset>
                <hr>
                <fieldset>
                    <legend>
                        Pattern
                        <a href="{{WIKI}}#pattern" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="sectionDescription">
                        Delete messages that match the regular expression
                    </div>
                    <div class="input-wrapper">
                        <span class="info">/</span>
                        <input id="pattern" type="text" placeholder="regular expression" priv>
                        <span class="info">/</span>
                    </div>
                </fieldset>
            </details>
            <details>
                <summary>Messages interval</summary>
                <fieldset>
                    <legend>
                        Interval of messages
                        <a href="{{WIKI}}#messages-interval" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="multiInput mb1">
                        <div class="input-wrapper">
                            <input id="minId" type="text" placeholder="After a message" priv>
                        </div>
                        <button id="pickMessageAfter">Pick</button>
                    </div>
                    <div class="multiInput">
                        <div class="input-wrapper">
                            <input id="maxId" type="text" placeholder="Before a message" priv>
                        </div>
                        <button id="pickMessageBefore">Pick</button>
                    </div>
                    <div class="sectionDescription">
                        Specify an interval to delete messages.
                    </div>
                </fieldset>
            </details>
            <details>
                <summary>Date interval</summary>
                <fieldset>
                    <legend>
                        After date
                        <a href="{{WIKI}}#date-interval" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="input-wrapper mb1">
                        <input id="minDate" type="datetime-local" title="Messages posted AFTER this date">
                    </div>
                    <legend>
                        Before date
                        <a href="{{WIKI}}#date-interval" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="input-wrapper">
                        <input id="maxDate" type="datetime-local" title="Messages posted BEFORE this date">
                    </div>
                    <div class="sectionDescription">
                        Delete messages that were posted between the two dates.
                    </div>
                    <div class="sectionDescription">
                        * Filtering by date doesn't work if you use the "Messages interval".
                    </div>
                </fieldset>
            </details>
            <hr>
            <details>
                <summary>Advanced settings</summary>
                <fieldset>
                    <legend>
                        Search delay
                        <a href="{{WIKI}}#delays" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="input-wrapper">
                        <input id="searchDelay" type="range" value="2000" step="100" min="100" max="60000">
                        <div id="searchDelayValue"></div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        Delete delay
                        <a href="{{WIKI}}#delays" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="input-wrapper">
                        <input id="deleteDelay" type="range" value="1000" step="50" min="50" max="10000">
                        <div id="deleteDelayValue"></div>
                    </div>
                    <br>
                    <div class="sectionDescription">
                        This will affect the speed in which the messages are deleted.
                        Use the help link for more information.
                    </div>
                </fieldset>
                <hr>
                <fieldset>
                    <legend>
                        Authorization Token
                        <a href="{{WIKI}}#authorization-token" title="Help" target="_blank" rel="noopener noreferrer">help</a>
                    </legend>
                    <div class="multiInput">
                        <div class="input-wrapper">
                            <input class="input" id="token" type="text" autocomplete="dont" priv>
                        </div>
                        <button id="getToken">fill</button>
                    </div>
                </fieldset>
            </details>
            <hr>
            <div></div>
            <div class="info">
                Purgecord {{VERSION}}
                <br> <a href="{{HOME}}" target="_blank" rel="noopener noreferrer">feelmypain</a>
            </div>
        </div>
        <div class="main col">
            <div class="tbar col">
                <div class="row">
                    <button id="toggleSidebar" class="sizeMedium icon">☰</button>
                    <button id="start" class="sizeMedium danger" style="width: 150px;" title="Start the deletion process">▶︎ Delete</button>
                    <button id="stop" class="sizeMedium" title="Stop the deletion process" disabled>🛑 Stop</button>
                    <button id="clear" class="sizeMedium">Clear log</button>
                    <label class="row" title="Hide sensitive information on your screen for taking screenshots">
                        <input id="redact" type="checkbox" checked> Streamer mode
                    </label>
                </div>
                <div class="row">
                    <progress id="progressBar" style="display:none;"></progress>
                </div>
            </div>
            <pre id="logArea" class="logarea scroll">
                <center>
                    <div>Star <a href="{{HOME}}" target="_blank" rel="noopener noreferrer">this project</a> on GitHub!</div>
                    <div><a href="{{HOME}}/issues" target="_blank" rel="noopener noreferrer">Report an issue</a></div>
                </center>
            </pre>
            <div class="tbar footer row">
                <div id="progressPercent"></div>
                <span class="spacer"></span>
                <label>
                    <input id="autoScroll" type="checkbox" checked> Auto scroll
                </label>
                <div class="resize-handle"></div>
            </div>
        </div>
    </div>
</div>

`);

	const log = {
	  debug() { return logFn ? logFn('debug', arguments) : console.debug.apply(console, arguments); },
	  info() { return logFn ? logFn('info', arguments) : console.info.apply(console, arguments); },
	  verb() { return logFn ? logFn('verb', arguments) : console.log.apply(console, arguments); },
	  warn() { return logFn ? logFn('warn', arguments) : console.warn.apply(console, arguments); },
	  error() { return logFn ? logFn('error', arguments) : console.error.apply(console, arguments); },
	  success() { return logFn ? logFn('success', arguments) : console.info.apply(console, arguments); },
	};

	var logFn; // custom console.log function
	const setLogFn = (fn) => logFn = fn;

	// Helpers

	/** Discord snowflakes count milliseconds from 2015-01-01T00:00:00Z. */
	const DISCORD_EPOCH = 1420070400000;

	const wait = async ms => new Promise(done => setTimeout(done, Math.max(0, Number(ms) || 0)));
	const msToHMS = ms => Number.isFinite(ms) && ms >= 0
	  ? `${ms / 3.6e6 | 0}h ${(ms % 3.6e6) / 6e4 | 0}m ${(ms % 6e4) / 1000 | 0}s`
	  : '--h --m --s';
	const escapeHTML = html => String(html).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#039;' })[m]);
	const redact = str => `<x>${escapeHTML(str)}</x>`;
	const queryString = params => params.filter(p => p[1] !== undefined && p[1] !== null && p[1] !== '').map(p => p[0] + '=' + encodeURIComponent(p[1])).join('&');
	const ask = async msg => new Promise(resolve => setTimeout(() => resolve(window.confirm(msg)), 10));
	const replaceInterpolations = (str, obj, removeMissing = false) => str.replace(/\{\{([\w_]+)\}\}/g, (m, key) => obj[key] || (removeMissing ? '' : m));

	const clamp = (value, min, max) => value < min ? min : value > max ? max : value;

	/** Discord ids are 17-20 digit snowflakes. */
	const isSnowflake = value => /^\d{17,20}$/.test(String(value).trim());

	/**
	 * Accept either a snowflake or a date and return a snowflake string.
	 * BigInt is required here: the shift overflows Number.MAX_SAFE_INTEGER, which
	 * used to quantize every date-range bound to a garbage value.
	 * Returns undefined for anything unusable so queryString drops the parameter.
	 */
	const toSnowflake = (value) => {
	  if (value === undefined || value === null) return undefined;
	  const str = String(value).trim();
	  if (!str) return undefined;
	  if (isSnowflake(str)) return str;
	  const time = Date.parse(str);
	  if (Number.isNaN(time)) return undefined;
	  // Anything before Discord existed is the same as no bound at all.
	  return ((BigInt(Math.max(time, DISCORD_EPOCH)) - BigInt(DISCORD_EPOCH)) << 22n).toString();
	};

	/**
	 * Render a user the way Discord does today. Migrated ("pomelo") accounts have
	 * a literal "0" discriminator, so the old username#discriminator form prints
	 * names like "someone#0".
	 */
	const displayName = (user) => {
	  if (!user) return 'unknown';
	  if (user.global_name) return user.global_name;
	  if (user.discriminator && user.discriminator !== '0') return `${user.username}#${user.discriminator}`;
	  return user.username || 'unknown';
	};

	const PREFIX$1 = '[PURGECORD]';

	/** Requests stay relative so they are same-origin on discord.com, ptb. and canary. */
	const API = '/api/v9';
	/** Discord returns at most 25 hits per search page. */
	const PAGE_SIZE = 25;
	const REQUEST_TIMEOUT = 30000;
	const MAX_SEARCH_ATTEMPTS = 20;
	/** How many times a finished walk may restart to sweep up stragglers. */
	const MAX_SWEEPS = 2;
	/** Rate-limit retries for one message, separate from the user's maxAttempt. */
	const MAX_THROTTLE_RETRIES = 5;
	const MAX_SEARCH_DELAY = 60000;
	const MAX_DELETE_DELAY = 30000;
	/** Padding on top of the retry_after Discord asks for, to survive clock skew. */
	const RETRY_MARGIN = 250;

	/**
	 * Message types Discord refuses to delete.
	 * Mirrors discord.js' UndeletableMessageTypes plus the client-only types
	 * documented as non-deletable. Everything not listed here is deletable, so new
	 * Discord message types keep working without a code change.
	 * @see https://discord.com/developers/docs/resources/message#message-object-message-types
	 */
	const UNDELETABLE_MESSAGE_TYPES = new Set([1, 2, 3, 4, 5, 21, 33, 34, 35, 56, 57, 64]);

	/**
	 * Discord error codes that will never succeed for this message. Retrying them
	 * only burns the invalid-request budget that leads to a Cloudflare ban.
	 */
	const PERMANENT_DELETE_ERRORS = {
	  50021: 'it is a system message',
	  50083: 'the thread is archived (open the thread to unarchive it, then run again)',
	  160005: 'the thread is locked',
	  50013: 'you do not have permission to delete it',
	  50001: 'you do not have access to that channel',
	  50003: 'that action cannot be performed on a DM channel',
	};

	// Outcome of a single delete attempt.
	const DELETED = 'DELETED';           // we removed it
	const ALREADY_GONE = 'ALREADY_GONE'; // it was gone before we got there
	const RETRY = 'RETRY';               // transient, worth another attempt
	const SKIPPED = 'SKIPPED';           // permanently undeletable, move on
	const FAILED = 'FAILED';             // unknown failure, retryable

	class PurgecordError extends Error {
	  constructor(message, { fatal = false, status = 0, code = 0 } = {}) {
	    super(message);
	    this.name = 'PurgecordError';
	    this.fatal = fatal;
	    this.status = status;
	    this.code = code;
	  }
	}

	/** Read a response body exactly once, parsing it as JSON when possible. */
	async function readBody(resp) {
	  let text = '';
	  try { text = await resp.text(); } catch { /* body already gone */ }
	  try { return { json: JSON.parse(text), text }; } catch { return { json: null, text }; }
	}

	/**
	 * How long Discord asked us to wait, in milliseconds.
	 * Both the Retry-After header and the JSON body report seconds.
	 */
	function retryAfterMs(resp, body) {
	  const header = parseFloat(resp.headers.get('retry-after'));
	  if (Number.isFinite(header)) return header * 1000;
	  const fromBody = body && Number(body.retry_after);
	  if (Number.isFinite(fromBody) && fromBody > 0) return fromBody * 1000;
	  return 0;
	}

	/**
	 * A 429 that is not Discord JSON came from Cloudflare, which bans the IP for
	 * up to 24h. Retrying it makes things strictly worse.
	 */
	function isEdgeBlock(resp, body) {
	  if (body && body.code === 40333) return true;
	  return resp.status === 429 && !body;
	}

	/** The text of a message as a user thinks of it, including modern shapes. */
	function messageText(message) {
	  const parts = [message.content || ''];
	  // Forwarded messages carry their text in a snapshot, not in content.
	  if (Array.isArray(message.message_snapshots)) {
	    for (const snapshot of message.message_snapshots) {
	      if (snapshot && snapshot.message && snapshot.message.content) parts.push(snapshot.message.content);
	    }
	  }
	  if (message.poll && message.poll.question) parts.push(message.poll.question.text || '');
	  return parts.join('\n');
	}

	/** A short human label for messages that have no text of their own. */
	function messagePreview(message) {
	  const text = messageText(message);
	  if (text) return text;
	  if (message.attachments && message.attachments.length) return '[ATTACHMENTS]';
	  if (message.poll) return '[POLL]';
	  if (message.flags & (1 << 14)) return '[FORWARDED]';
	  if (message.flags & (1 << 13)) return '[VOICE MESSAGE]';
	  if (message.embeds && message.embeds.length) return '[EMBED]';
	  return '';
	}

	/**
	 * Delete all messages in a Discord channel or DM
	 * @author Victornpb <https://www.github.com/victornpb>
	 * @see https://github.com/victornpb/undiscord
	 */
	class PurgecordCore {

	  options = {
	    authToken: null, // Your authorization token
	    authorId: null, // Author of the messages you want to delete
	    guildId: null, // Server were the messages are located
	    channelId: null, // Channel were the messages are located
	    minId: null, // Only delete messages after this, leave blank do delete all
	    maxId: null, // Only delete messages before this, leave blank do delete all
	    content: null, // Filter messages that contains this text content
	    hasLink: null, // Filter messages that contains link
	    hasFile: null, // Filter messages that contains file
	    includeNsfw: null, // Search in NSFW channels
	    includePinned: null, // Delete messages that are pinned
	    pattern: null, // Only delete messages that match the regex (insensitive)
	    searchDelay: null, // Delay each time we fetch for more messages
	    deleteDelay: null, // Delay between each delete operation
	    maxAttempt: 2, // Attempts to delete a single message if it fails
	    emptyPageRetries: 3, // Times to re-check an empty page before believing the channel is done
	    jobDelay: 10000, // Delay between channels when running a batch
	    askForConfirmation: true,
	    debug: false, // Dump raw API payloads to the browser console
	  };

	  state = {
	    running: false,
	    delCount: 0,
	    confirmedDelCount: 0, // deletes the API confirmed, i.e. not "already gone"
	    failCount: 0,
	    grandTotal: 0,
	    iterations: 0,
	    cursorId: null, // max_id of the next search page (see advanceCursor)
	    emptyPages: 0,

	    _searchResponse: null,
	    _messagesToDelete: [],
	    _skippedMessages: [],
	  };

	  stats = {
	    startTime: new Date(), // start time
	    throttledCount: 0, // how many times you have been throttled
	    throttledTotalTime: 0, // the total amount of time you spent being throttled
	    lastPing: null, // the most recent ping
	    avgPing: null, // average ping used to calculate the estimated remaining time
	    etr: 0,

	    // Adaptive pacing. These are added on top of the delays the user configured
	    // and decay back to zero; options is never written to.
	    searchBackoff: 0,
	    deleteBackoff: 0,
	    searchNextAt: 0,
	    deleteNextAt: 0,
	  };

	  // events
	  onStart = undefined;
	  onProgress = undefined;
	  onStop = undefined;

	  /** Whether a run or batch is currently in flight. */
	  get busy() { return this.#busy; }

	  resetState() {
	    this.state = {
	      running: false,
	      delCount: 0,
	      confirmedDelCount: 0,
	      failCount: 0,
	      grandTotal: 0,
	      iterations: 0,
	      cursorId: null,
	      emptyPages: 0,

	      _searchResponse: null,
	      _messagesToDelete: [],
	      _skippedMessages: [],
	    };

	    // Keep the cumulative throttle counters, drop everything that would poison
	    // the next run (a stale backoff would silently slow it down).
	    this.stats.searchBackoff = 0;
	    this.stats.deleteBackoff = 0;
	    this.stats.searchNextAt = 0;
	    this.stats.deleteNextAt = 0;
	    this.stats.etr = 0;

	    this.options.askForConfirmation = true;
	  }

	  /** Automate the deletion process of multiple channels */
	  async runBatch(queue) {
	    if (this.#busy) return log.error('Already running!');
	    this.#busy = true;

	    // Job options must not leak into the next job.
	    const baseOptions = { ...this.options };

	    log.info(`Runnning batch with queue of ${queue.length} jobs`);
	    this.state.running = true;
	    // The batch owns the lifecycle: firing these per job would unlock the UI
	    // (and kill the Stop button) during every inter-job pause.
	    if (this.onStart) this.onStart(this.state, this.stats);

	    try {
	      for (let i = 0; i < queue.length; i++) {
	        if (!this.state.running) break;

	        // Firing every job's first search back to back is a self-inflicted 429.
	        if (i > 0) {
	          log.verb(`Waiting ${(this.options.jobDelay / 1000).toFixed(1)}s before the next channel...`);
	          await this.cooldown(this.options.jobDelay);
	          if (!this.state.running) break;
	        }

	        this.options = { ...baseOptions, ...queue[i] };
	        log.info('Starting job...', `(${i + 1}/${queue.length})`);

	        try {
	          await this.run(true);
	        } catch (err) {
	          log.error(`Job ${i + 1} failed:`, escapeHTML(err && err.message || err));
	          // A dead token or an edge block fails identically for every remaining
	          // job, so there is nothing to be gained by continuing.
	          if (err && err.fatal) {
	            this.state.running = false;
	            break;
	          }
	        }

	        if (!this.state.running) break;

	        log.info('Job ended.', `(${i + 1}/${queue.length})`);
	        // Carry the prompt state forward only if this job actually prompted;
	        // a job that died early must not silence the rest of the batch.
	        baseOptions.askForConfirmation = this.options.askForConfirmation;
	        this.resetState();
	        this.state.running = true; // continue running
	      }
	    } finally {
	      this.options = baseOptions;
	      this.state.running = false;
	      this.#busy = false;
	      log.info('Batch finished.');
	      if (this.onStop) this.onStop(this.state, this.stats);
	    }
	  }

	  /** Start the deletion process */
	  async run(isJob = false) {
	    if (this.#busy && !isJob) return log.error('Already running!');
	    if (!this.options.guildId) return log.error('You must fill the "Server ID" field!');
	    if (this.options.guildId === '@me' && !this.options.channelId) return log.error('You must fill the "Channel ID" field to delete direct messages!');
	    if (!isJob) this.#busy = true;

	    this.state.running = true;
	    this.stats.startTime = new Date();
	    // The walk starts at the user's upper bound and moves backwards in time.
	    this.state.cursorId = toSnowflake(this.options.maxId) || null;

	    log.success(`\nStarted at ${this.stats.startTime.toLocaleString()}`);
	    log.debug(
	      `authorId = "${redact(this.options.authorId)}"`,
	      `guildId = "${redact(this.options.guildId)}"`,
	      `channelId = "${redact(this.options.channelId)}"`,
	      `minId = "${redact(this.options.minId)}"`,
	      `maxId = "${redact(this.options.maxId)}"`,
	      `hasLink = ${!!this.options.hasLink}`,
	      `hasFile = ${!!this.options.hasFile}`,
	    );

	    if (!isJob && this.onStart) this.onStart(this.state, this.stats); // a batch owns its own lifecycle

	    // When a walk finishes having actually removed something we sweep the
	    // channel again, because Discord's search index can hide messages that were
	    // there all along. A pass has to confirm a deletion to earn the next one,
	    // and MAX_SWEEPS bounds it regardless.
	    let deletedBeforePass = 0;
	    let sweeps = 0;

	    try {
	      do {
	        this.state.iterations++;

	        log.verb('Fetching messages...');
	        await this.pace('search');
	        if (!this.state.running) break;

	        const data = await this.search();
	        if (!this.state.running) break;
	        if (!data) break; // nothing more we can do with this channel

	        this.filterResponse(data);

	        const found = this.state._messagesToDelete.length + this.state._skippedMessages.length;
	        log.verb(
	          `Grand total: ${this.state.grandTotal}`,
	          `(Messages in current page: ${found}`,
	          `To be deleted: ${this.state._messagesToDelete.length}`,
	          `Skipped: ${this.state._skippedMessages.length})`
	        );
	        this.printStats();

	        // Calculate estimated time
	        this.calcEtr();
	        log.verb(`Estimated time remaining: ${msToHMS(this.stats.etr)}`);

	        if (found === 0) {
	          // Discord's search index lags behind deletions, so a single empty
	          // page does not mean the channel is clean.
	          const remaining = Number(data.total_results) || 0;
	          if (remaining === 0 || this.state.emptyPages >= this.options.emptyPageRetries) {
	            if (this.state.confirmedDelCount > deletedBeforePass && sweeps < MAX_SWEEPS) {
	              sweeps++;
	              log.verb(`Reached the end. Sweeping the channel again to catch anything the search index was hiding... (${sweeps}/${MAX_SWEEPS})`);
	              deletedBeforePass = this.state.confirmedDelCount;
	              this.state.cursorId = toSnowflake(this.options.maxId) || null;
	              this.state.emptyPages = 0;
	              continue;
	            }
	            log.verb('Ended because the API returned an empty page.');
	            if (isJob) break; // break without stopping if this is part of a job
	            this.state.running = false;
	            break;
	          }
	          this.state.emptyPages++;
	          const settle = this.state.emptyPages * Math.max(this.options.searchDelay, 2000);
	          log.warn(
	            `The page came back empty but the API still reports ${remaining} message(s).`,
	            `Waiting ${(settle / 1000).toFixed(1)}s for the search index to catch up...`,
	            `(${this.state.emptyPages}/${this.options.emptyPageRetries})`
	          );
	          await this.cooldown(settle);
	          continue;
	        }

	        this.state.emptyPages = 0;

	        if (this.state._messagesToDelete.length > 0) {
	          if (await this.confirm() === false) {
	            this.state.running = false; // break out of a job
	            break; // immmediately stop this iteration
	          }

	          await this.deleteMessagesFromList();
	        }
	        else {
	          // A page full of things we cannot delete (system messages, pinned,
	          // filtered out). Nothing to do but page past them.
	          log.verb('There\'s nothing we can delete on this page, checking next page...');
	        }

	        // Walk past everything this page returned. Paging by id instead of by
	        // offset means deleting messages cannot shift the window under us, and
	        // there is no 9975 offset ceiling to hit.
	        this.advanceCursor();

	      } while (this.state.running);
	    } finally {
	      this.stats.endTime = new Date();
	      log.success(`Ended at ${this.stats.endTime.toLocaleString()}! Total time: ${msToHMS(this.stats.endTime.getTime() - this.stats.startTime.getTime())}`);
	      this.printStats();
	      log.debug(`Deleted ${this.state.delCount} messages, ${this.state.failCount} failed.\n`);
	      if (this.state.failCount > 0) log.info('Run it again to retry the messages that failed.');

	      if (!isJob) {
	        // A batch keeps state.running set so its loop can continue; a plain run
	        // owns the flag and must clear it however it exited.
	        this.state.running = false;
	        this.#busy = false;
	        if (this.onStop) this.onStop(this.state, this.stats);
	      }
	    }
	  }

	  stop() {
	    this.state.running = false;
	    // The loop's finally block unlocks the UI once it actually unwinds; doing it
	    // here as well would re-enable Start while a request is still in flight.
	    if (!this.#busy && this.onStop) this.onStop(this.state, this.stats);
	  }

	  /**
	   * Move the pagination cursor just past the oldest message of the current
	   * page. Snowflakes are time-ordered, so forcing the cursor to strictly
	   * decrease guarantees the walk terminates even if the API ever treats max_id
	   * as inclusive.
	   */
	  advanceCursor() {
	    const page = this.state._messagesToDelete.concat(this.state._skippedMessages);
	    if (!page.length) return;

	    // The page is sorted newest first, but do not trust that for correctness.
	    let oldest = null;
	    for (const message of page) {
	      if (!/^\d+$/.test(message.id)) continue;
	      const id = BigInt(message.id);
	      if (oldest === null || id < oldest) oldest = id;
	    }
	    if (oldest === null) return;

	    const current = this.state.cursorId ? BigInt(this.state.cursorId) : null;
	    if (current !== null && oldest >= current) oldest = current - 1n;
	    this.state.cursorId = oldest.toString();
	  }

	  /** Calculate the estimated time remaining based on the current stats */
	  calcEtr() {
	    const remaining = Math.max(0, this.state.grandTotal - this.state.delCount - this.state.failCount);
	    const perMessage = this.options.deleteDelay + this.stats.deleteBackoff + (this.stats.avgPing || 0);
	    const perPage = this.options.searchDelay + this.stats.searchBackoff;
	    this.stats.etr = (perPage * Math.ceil(remaining / PAGE_SIZE)) + (perMessage * remaining);
	  }

	  /** As for confirmation in the beggining process */
	  async confirm() {
	    if (!this.options.askForConfirmation) return true;

	    log.verb('Waiting for your confirmation...');
	    const preview = this.state._messagesToDelete.map(m => `${displayName(m.author)}: ${messagePreview(m)}`).join('\n');

	    const answer = await ask(
	      `Do you want to delete ~${this.state.grandTotal} messages? (Estimated time: ${msToHMS(this.stats.etr)})` +
	      '(The actual number of messages may be less, depending if you\'re using filters to skip some messages)' +
	      '\n\n---- Preview ----\n' +
	      preview
	    );

	    if (!answer) {
	      log.error('Aborted by you!');
	      return false;
	    }
	    else {
	      log.verb('OK');
	      this.options.askForConfirmation = false; // do not ask for confirmation again on the next request
	      return true;
	    }
	  }

	  async search() {
	    const isDM = this.options.guildId === '@me';
	    const url = isDM
	      ? `${API}/channels/${this.options.channelId}/messages/search?` // DMs
	      : `${API}/guilds/${this.options.guildId}/messages/search?`; // Server

	    const query = queryString([
	      ['limit', PAGE_SIZE],
	      ['author_id', this.options.authorId || undefined],
	      ['channel_id', (!isDM && this.options.channelId) || undefined],
	      ['min_id', toSnowflake(this.options.minId)],
	      ['max_id', this.state.cursorId || undefined],
	      ['sort_by', 'timestamp'],
	      ['sort_order', 'desc'],
	      ['has', this.options.hasLink ? 'link' : undefined],
	      ['has', this.options.hasFile ? 'file' : undefined],
	      ['content', this.options.content || undefined],
	      ['include_nsfw', this.options.includeNsfw ? true : undefined],
	    ]);

	    for (let attempt = 1; attempt <= MAX_SEARCH_ATTEMPTS; attempt++) {
	      if (!this.state.running) return null;

	      let resp;
	      try {
	        resp = await this.request(url + query);
	      } catch (err) {
	        // Network error or timeout. Worth retrying, the API never saw it.
	        log.warn('Search request failed:', escapeHTML(err && err.message || err));
	        this.penalize('search', MAX_SEARCH_DELAY);
	        await this.cooldown(this.effectiveDelay('search'));
	        continue;
	      }

	      const { json, text } = await readBody(resp);

	      if (isEdgeBlock(resp, json)) throw this.edgeBlocked();

	      // Not indexed yet
	      if (resp.status === 202) {
	        const w = clamp(retryAfterMs(resp, json) || 5000, 1000, MAX_SEARCH_DELAY);
	        this.stats.throttledCount++;
	        this.stats.throttledTotalTime += w;
	        log.warn(`This channel isn't indexed yet. Waiting ${(w / 1000).toFixed(1)}s for discord to index it...`);
	        await this.cooldown(w);
	        continue;
	      }

	      if (resp.status === 429) {
	        this.penalize('search', MAX_SEARCH_DELAY);
	        // Honour whatever Discord asked for in full — capping it would just put
	        // us back inside the window it told us to stay out of. A retry_after of
	        // 0 means "we did not say", so fall back to our own pace.
	        const asked = retryAfterMs(resp, json);
	        const w = (asked > 0 ? asked : clamp(this.effectiveDelay('search'), 1000, MAX_SEARCH_DELAY)) + RETRY_MARGIN;
	        this.stats.throttledCount++;
	        this.stats.throttledTotalTime += w;
	        log.warn(`Being rate limited by the API for ${w}ms! Slowing down searches...`);
	        this.printStats();
	        await this.cooldown(w);
	        continue;
	      }

	      if (!resp.ok) {
	        const code = json && json.code;

	        if (resp.status === 401) {
	          throw new PurgecordError('Your authorization token is invalid or expired. Press "fill" to grab a fresh one.', { fatal: true, status: 401 });
	        }
	        // The channel is gone, or was never ours to read. End this job quietly
	        // so a batch over an old archive is not killed by one dead server.
	        if (resp.status === 403 || resp.status === 404 || code === 50001 || code === 50024) {
	          log.warn(`Skipping this channel, the API responded with status ${resp.status}:`, escapeHTML(text));
	          return null;
	        }
	        throw new PurgecordError(`Error searching messages, API responded with status ${resp.status}! ${text}`, { status: resp.status, code });
	      }

	      this.updatePace('search', resp);
	      this.relax('search');

	      const data = json || {};
	      this.state._searchResponse = data;
	      if (this.options.debug) console.log(PREFIX$1, 'search', data);
	      return data;
	    }

	    throw new PurgecordError(`Giving up on searching after ${MAX_SEARCH_ATTEMPTS} attempts.`);
	  }

	  filterResponse(data) {
	    // the search total will decrease as we delete stuff
	    const total = Number(data.total_results) || 0;
	    if (total > this.state.grandTotal) this.state.grandTotal = total;

	    // Each hit is wrapped in an array that used to carry the surrounding
	    // conversation; Discord no longer returns that context.
	    // Never guess which element was the hit: picking wrong here would delete a
	    // message the search did not match.
	    const groups = Array.isArray(data.messages) ? data.messages : [];
	    const discoveredMessages = groups
	      .map(group => {
	        if (!Array.isArray(group)) return group;
	        return group.find(message => message.hit === true) || (group.length === 1 ? group[0] : null);
	      })
	      .filter(message => message && message.id);

	    // We can only delete some types of messages, system messages are not deletable.
	    let messagesToDelete = discoveredMessages;
	    messagesToDelete = messagesToDelete.filter(msg => !UNDELETABLE_MESSAGE_TYPES.has(msg.type));
	    messagesToDelete = messagesToDelete.filter(msg => msg.pinned ? this.options.includePinned : true);

	    // custom filter of messages
	    if (this.options.pattern) {
	      try {
	        const regex = new RegExp(this.options.pattern, 'i');
	        messagesToDelete = messagesToDelete.filter(msg => regex.test(messageText(msg)));
	      } catch (e) {
	        log.warn('Ignoring RegExp because pattern is malformed!', e);
	      }
	    }

	    // create an array containing everything we skipped (used to page past them)
	    const skippedMessages = discoveredMessages.filter(msg => !messagesToDelete.includes(msg));

	    this.state._messagesToDelete = messagesToDelete;
	    this.state._skippedMessages = skippedMessages;

	    if (this.options.debug) console.log(PREFIX$1, 'filterResponse', { toDelete: messagesToDelete.length, skipped: skippedMessages.length, cursorId: this.state.cursorId });
	  }

	  async deleteMessagesFromList() {
	    for (let i = 0; i < this.state._messagesToDelete.length; i++) {
	      const message = this.state._messagesToDelete[i];
	      if (!this.state.running) return log.error('Stopped by you!');

	      log.debug(
	        `[${this.state.delCount + 1}/${this.state.grandTotal}] ` +
	        `<sup>${new Date(message.timestamp).toLocaleString()}</sup> ` +
	        `<b>${redact(displayName(message.author))}</b>` +
	        `: <i>${redact(messagePreview(message)).replace(/\n/g, '↵')}</i>`,
	        `<sup>{ID:${redact(message.id)}}</sup>`
	      );

	      // Delete a single message. Being throttled is not the message's fault, so
	      // it gets its own (larger) budget than an actual failure.
	      let result = FAILED;
	      let failures = 0;
	      let throttles = 0;
	      for (;;) {
	        await this.pace('delete');
	        if (!this.state.running) return log.error('Stopped by you!');

	        result = await this.deleteMessage(message);

	        if (result === RETRY) {
	          if (++throttles >= MAX_THROTTLE_RETRIES) break;
	        }
	        else if (result === FAILED) {
	          if (++failures >= this.options.maxAttempt) break;
	          log.verb(`Retrying... (${failures}/${this.options.maxAttempt})`);
	        }
	        else break;
	      }

	      if (result === DELETED || result === ALREADY_GONE) {
	        this.state.delCount++;
	        // Only a message we actually removed proves the run is progressing.
	        if (result === DELETED) this.state.confirmedDelCount++;
	      }
	      else {
	        // Counted once, then left behind. The cursor moves past it either way,
	        // which is what stops an undeletable message from being re-found forever.
	        this.state.failCount++;
	      }

	      this.calcEtr();
	      if (this.onProgress) this.onProgress(this.state, this.stats);
	    }
	  }

	  async deleteMessage(message) {
	    let resp;
	    try {
	      resp = await this.request(`${API}/channels/${message.channel_id}/messages/${message.id}`, { method: 'DELETE' });
	    } catch (err) {
	      // No response at all (network error, timeout). Nothing updated the pacing
	      // clock, so re-arm it by hand or the retries fire back to back.
	      log.error('Delete request threw an error:', escapeHTML(err && err.message || err));
	      this.stats.deleteNextAt = Date.now() + this.effectiveDelay('delete');
	      return FAILED;
	    }

	    const { json, text } = await readBody(resp);

	    if (isEdgeBlock(resp, json)) throw this.edgeBlocked();

	    if (resp.ok) {
	      this.updatePace('delete', resp);
	      this.relax('delete');
	      return DELETED;
	    }

	    const code = json && json.code;

	    if (resp.status === 429) {
	      // deleting messages too fast
	      this.penalize('delete', MAX_DELETE_DELAY);
	      const asked = retryAfterMs(resp, json);
	      const w = (asked > 0 ? asked : clamp(this.effectiveDelay('delete'), 500, MAX_DELETE_DELAY)) + RETRY_MARGIN;
	      this.stats.throttledCount++;
	      this.stats.throttledTotalTime += w;
	      log.warn(`Being rate limited by the API for ${w}ms! Slowing down deletions...`);
	      this.printStats();
	      // Retry-After is authoritative here, so gate the next attempt on it
	      // directly instead of stacking another delay on top.
	      this.stats.deleteNextAt = Date.now() + w;
	      return RETRY;
	    }

	    // Someone (or a previous run) already deleted it. That is the outcome we
	    // wanted, but it is not proof that this run is making progress — see the
	    // sweep accounting in run().
	    if (resp.status === 404 && code === 10008) {
	      log.verb('That message was already gone.');
	      this.updatePace('delete', resp);
	      return ALREADY_GONE;
	    }

	    if (resp.status === 401) {
	      throw new PurgecordError('Your authorization token is invalid or expired. Press "fill" to grab a fresh one.', { fatal: true, status: 401 });
	    }

	    // Documented as "Unknown Message", but a 403 carrying it means Discord's
	    // anti-abuse systems blocked the request. Hammering it makes it worse.
	    if (resp.status === 403 && code === 10008) {
	      throw new PurgecordError('Discord blocked this request. Stopping — wait a while before trying again.', { fatal: true, status: 403, code });
	    }

	    this.updatePace('delete', resp);

	    const reason = PERMANENT_DELETE_ERRORS[code];
	    if (reason || resp.status === 403) {
	      log.warn(`Skipping a message because ${reason || 'the API refused it'}.`, `<sup>{ID:${redact(message.id)}}</sup>`);
	      return SKIPPED;
	    }

	    log.error(`Error deleting message, API responded with status ${resp.status}!`, escapeHTML(text));
	    log.verb('Related object:', redact(JSON.stringify(message)));
	    return FAILED;
	  }

	  /** All API traffic goes through here so pings and timeouts are handled once. */
	  async request(url, init = {}) {
	    this.beforeRequest();
	    try {
	      return await fetch(url, {
	        ...init,
	        headers: {
	          'Authorization': this.options.authToken,
	          ...init.headers,
	        },
	        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
	      });
	    } finally {
	      this.afterRequest();
	    }
	  }

	  edgeBlocked() {
	    return new PurgecordError(
	      'Blocked by Cloudflare — too many requests reached Discord\'s edge. ' +
	      'Stop for a while (this can last up to 24h) and use larger delays next time.',
	      { fatal: true, status: 429 }
	    );
	  }

	  /** The delay we should currently keep between requests of a given kind. */
	  effectiveDelay(kind) {
	    const configured = kind === 'search' ? this.options.searchDelay : this.options.deleteDelay;
	    const ceiling = kind === 'search' ? MAX_SEARCH_DELAY : MAX_DELETE_DELAY;
	    const backoff = kind === 'search' ? this.stats.searchBackoff : this.stats.deleteBackoff;
	    return clamp((Number(configured) || 0) + backoff, 0, ceiling);
	  }

	  /** Wait until we are allowed to issue the next request of this kind. */
	  async pace(kind) {
	    const due = kind === 'search' ? this.stats.searchNextAt : this.stats.deleteNextAt;
	    await this.cooldown(due - Date.now());
	  }

	  /**
	   * Sleep, but in slices, so pressing Stop during a multi-minute cooldown does
	   * not leave the user staring at a frozen window.
	   */
	  async cooldown(ms) {
	    const until = Date.now() + ms;
	    for (;;) {
	      const left = until - Date.now();
	      if (left <= 0 || !this.state.running) return;
	      await wait(Math.min(left, 1000));
	    }
	  }

	  /**
	   * Schedule the earliest time the next request of this kind may go out.
	   * Discord only reliably sends bucket headers to bots, so they are used when
	   * present and the configured delay carries the rest.
	   */
	  updatePace(kind, resp, extraWaitMs = 0) {
	    let delay = this.effectiveDelay(kind);

	    // Missing headers must not look like an empty bucket: Headers.get() returns
	    // null when absent and Number(null) is 0.
	    const remaining = resp.headers.get('x-ratelimit-remaining');
	    const resetAfter = resp.headers.get('x-ratelimit-reset-after');
	    if (remaining !== null && resetAfter !== null && Number(remaining) === 0) {
	      const refillMs = Number(resetAfter) * 1000;
	      // Bucket is empty: never issue the next request before it refills.
	      if (Number.isFinite(refillMs)) delay = Math.max(delay, refillMs + RETRY_MARGIN);
	    }

	    const next = Date.now() + delay + extraWaitMs;
	    if (kind === 'search') this.stats.searchNextAt = next;
	    else this.stats.deleteNextAt = next;
	  }

	  /** Grow the adaptive backoff after being throttled. */
	  penalize(kind, ceiling) {
	    const current = kind === 'search' ? this.stats.searchBackoff : this.stats.deleteBackoff;
	    const next = clamp(current * 2 + 500, 0, ceiling);
	    if (kind === 'search') this.stats.searchBackoff = next;
	    else this.stats.deleteBackoff = next;
	  }

	  /** Ease the backoff back down after a request that was not throttled. */
	  relax(kind) {
	    const current = kind === 'search' ? this.stats.searchBackoff : this.stats.deleteBackoff;
	    const next = Math.max(0, current * 0.8 - 50);
	    if (kind === 'search') this.stats.searchBackoff = next;
	    else this.stats.deleteBackoff = next;
	  }

	  /** True while a run/batch is actually in flight. Unlike state.running it is
	   * not cleared by resetState() or by the Stop button, so it is what re-entry
	   * is guarded on. */
	  #busy = false;

	  #beforeTs = 0; // used to calculate latency
	  beforeRequest() {
	    this.#beforeTs = Date.now();
	  }
	  afterRequest() {
	    this.stats.lastPing = (Date.now() - this.#beforeTs);
	    this.stats.avgPing = this.stats.avgPing > 0 ? (this.stats.avgPing * 0.9) + (this.stats.lastPing * 0.1) : this.stats.lastPing;
	  }

	  printStats() {
	    log.verb(
	      `Delete delay: ${this.effectiveDelay('delete') | 0}ms, Search delay: ${this.effectiveDelay('search') | 0}ms`,
	      `Last Ping: ${this.stats.lastPing}ms, Average Ping: ${this.stats.avgPing | 0}ms`,
	    );
	    log.verb(
	      `Rate Limited: ${this.stats.throttledCount} times.`,
	      `Total time throttled: ${msToHMS(this.stats.throttledTotalTime)}.`
	    );
	  }
	}

	const MOVE = 0;
	const RESIZE_T = 1;
	const RESIZE_B = 2;
	const RESIZE_L = 4;
	const RESIZE_R = 8;
	const RESIZE_TL = RESIZE_T + RESIZE_L;
	const RESIZE_TR = RESIZE_T + RESIZE_R;
	const RESIZE_BL = RESIZE_B + RESIZE_L;
	const RESIZE_BR = RESIZE_B + RESIZE_R;

	/**
	 * Make an element draggable/resizable
	 * @author Victor N. wwww.vitim.us
	 */
	class DragResize {
	  constructor({ elm, moveHandle, options }) {
	    this.options = defaultArgs({
	      enabledDrag: true,
	      enabledResize: true,
	      minWidth: 200,
	      maxWidth: Infinity,
	      minHeight: 100,
	      maxHeight: Infinity,
	      dragAllowX: true,
	      dragAllowY: true,
	      resizeAllowX: true,
	      resizeAllowY: true,
	      draggingClass: 'drag',
	      useMouseEvents: true,
	      useTouchEvents: true,
	      createHandlers: true,
	    }, options);
	    Object.assign(this, options);
	    options = undefined;

	    elm.style.position = 'fixed';

	    this.drag_m = new Draggable(elm, moveHandle, MOVE, this.options);

	    if (this.options.createHandlers) {
	      this.el_t = createElement('div', { name: 'grab-t' }, elm);
	      this.drag_t = new Draggable(elm, this.el_t, RESIZE_T, this.options);
	      this.el_r = createElement('div', { name: 'grab-r' }, elm);
	      this.drag_r = new Draggable(elm, this.el_r, RESIZE_R, this.options);
	      this.el_b = createElement('div', { name: 'grab-b' }, elm);
	      this.drag_b = new Draggable(elm, this.el_b, RESIZE_B, this.options);
	      this.el_l = createElement('div', { name: 'grab-l' }, elm);
	      this.drag_l = new Draggable(elm, this.el_l, RESIZE_L, this.options);
	      this.el_tl = createElement('div', { name: 'grab-tl' }, elm);
	      this.drag_tl = new Draggable(elm, this.el_tl, RESIZE_TL, this.options);
	      this.el_tr = createElement('div', { name: 'grab-tr' }, elm);
	      this.drag_tr = new Draggable(elm, this.el_tr, RESIZE_TR, this.options);
	      this.el_br = createElement('div', { name: 'grab-br' }, elm);
	      this.drag_br = new Draggable(elm, this.el_br, RESIZE_BR, this.options);
	      this.el_bl = createElement('div', { name: 'grab-bl' }, elm);
	      this.drag_bl = new Draggable(elm, this.el_bl, RESIZE_BL, this.options);
	    }
	  }
	}

	class Draggable {
	  constructor(targetElm, handleElm, op, options) {
	    Object.assign(this, options);
	    options = undefined;

	    this._targetElm = targetElm;
	    this._handleElm = handleElm;

	    let vw = window.innerWidth;
	    let vh = window.innerHeight;
	    let initialX, initialY, initialT, initialL, initialW, initialH;

	    const clamp = (value, min, max) => value < min ? min : value > max ? max : value;

	    const moveOp = (x, y) => {
	      const deltaX = (x - initialX);
	      const deltaY = (y - initialY);
	      const t = clamp(initialT + deltaY, 0, vh - initialH);
	      const l = clamp(initialL + deltaX, 0, vw - initialW);
	      this._targetElm.style.top = t + 'px';
	      this._targetElm.style.left = l + 'px';
	    };

	    const resizeOp = (x, y) => {
	      x = clamp(x, 0, vw);
	      y = clamp(y, 0, vh);
	      const deltaX = (x - initialX);
	      const deltaY = (y - initialY);
	      const resizeDirX = (op & RESIZE_L) ? -1 : 1;
	      const resizeDirY = (op & RESIZE_T) ? -1 : 1;
	      const deltaXMax = (this.maxWidth - initialW);
	      const deltaXMin = (this.minWidth - initialW);
	      const deltaYMax = (this.maxHeight - initialH);
	      const deltaYMin = (this.minHeight - initialH);
	      const t = initialT + clamp(deltaY * resizeDirY, deltaYMin, deltaYMax) * resizeDirY;
	      const l = initialL + clamp(deltaX * resizeDirX, deltaXMin, deltaXMax) * resizeDirX;
	      const w = initialW + clamp(deltaX * resizeDirX, deltaXMin, deltaXMax);
	      const h = initialH + clamp(deltaY * resizeDirY, deltaYMin, deltaYMax);
	      if (op & RESIZE_T) { // resize ↑
	        this._targetElm.style.top = t + 'px';
	        this._targetElm.style.height = h + 'px';
	      }
	      if (op & RESIZE_B) { // resize ↓
	        this._targetElm.style.height = h + 'px';
	      }
	      if (op & RESIZE_L) { // resize ←
	        this._targetElm.style.left = l + 'px';
	        this._targetElm.style.width = w + 'px';
	      }
	      if (op & RESIZE_R) { // resize →
	        this._targetElm.style.width = w + 'px';
	      }
	    };

	    let operation = op === MOVE ? moveOp : resizeOp;

	    function dragStartHandler(e) {
	      const touch = e.type === 'touchstart';
	      if ((e.buttons === 1 || e.which === 1) || touch) {
	        e.preventDefault();
	        const x = touch ? e.touches[0].clientX : e.clientX;
	        const y = touch ? e.touches[0].clientY : e.clientY;
	        initialX = x;
	        initialY = y;
	        vw = window.innerWidth;
	        vh = window.innerHeight;
	        initialT = this._targetElm.offsetTop;
	        initialL = this._targetElm.offsetLeft;
	        initialW = this._targetElm.clientWidth;
	        initialH = this._targetElm.clientHeight;
	        if (this.useMouseEvents) {
	          document.addEventListener('mousemove', this._dragMoveHandler);
	          document.addEventListener('mouseup', this._dragEndHandler);
	        }
	        if (this.useTouchEvents) {
	          document.addEventListener('touchmove', this._dragMoveHandler, { passive: false });
	          document.addEventListener('touchend', this._dragEndHandler);
	        }
	        this._targetElm.classList.add(this.draggingClass);
	      }
	    }

	    function dragMoveHandler(e) {
	      e.preventDefault();
	      let x, y;
	      const touch = e.type === 'touchmove';
	      if (touch) {
	        const t = e.touches[0];
	        x = t.clientX;
	        y = t.clientY;
	      } else { //mouse
	        // If the button is not down, dispatch a "fake" mouse up event, to stop listening to mousemove
	        // This happens when the mouseup is not captured (outside the browser)
	        if ((e.buttons || e.which) !== 1) {
	          this._dragEndHandler();
	          return;
	        }
	        x = e.clientX;
	        y = e.clientY;
	      }
	      // perform drag / resize operation
	      operation(x, y);
	    }

	    function dragEndHandler(e) {
	      if (this.useMouseEvents) {
	        document.removeEventListener('mousemove', this._dragMoveHandler);
	        document.removeEventListener('mouseup', this._dragEndHandler);
	      }
	      if (this.useTouchEvents) {
	        document.removeEventListener('touchmove', this._dragMoveHandler);
	        document.removeEventListener('touchend', this._dragEndHandler);
	      }
	      this._targetElm.classList.remove(this.draggingClass);
	    }

	    // We need to bind the handlers to this instance
	    this._dragStartHandler = dragStartHandler.bind(this);
	    this._dragMoveHandler = dragMoveHandler.bind(this);
	    this._dragEndHandler = dragEndHandler.bind(this);

	    this.enable();
	  }

	  /** Turn on the drag and drop of the instance */
	  enable() {
	    this.destroy(); // prevent events from getting binded twice
	    if (this.useMouseEvents) this._handleElm.addEventListener('mousedown', this._dragStartHandler);
	    if (this.useTouchEvents) this._handleElm.addEventListener('touchstart', this._dragStartHandler, { passive: false });
	  }

	  /** Teardown all events bound to the document and elements. You can resurrect this instance by calling enable() */
	  destroy() {
	    this._targetElm.classList.remove(this.draggingClass);
	    if (this.useMouseEvents) {
	      this._handleElm.removeEventListener('mousedown', this._dragStartHandler);
	      document.removeEventListener('mousemove', this._dragMoveHandler);
	      document.removeEventListener('mouseup', this._dragEndHandler);
	    }
	    if (this.useTouchEvents) {
	      this._handleElm.removeEventListener('touchstart', this._dragStartHandler);
	      document.removeEventListener('touchmove', this._dragMoveHandler);
	      document.removeEventListener('touchend', this._dragEndHandler);
	    }
	  }
	}

	function createElement(tag='div', attrs, parent) {
	  const elm = document.createElement(tag);
	  if (attrs) Object.entries(attrs).forEach(([k, v]) => elm.setAttribute(k, v));
	  if (parent) parent.appendChild(elm);
	  return elm;
	}

	function defaultArgs(defaults, options) {
	  function isObj(x) { return x !== null && typeof x === 'object'; }
	  function hasOwn(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
	  if (isObj(options)) for (let prop in defaults) {
	    if (hasOwn(defaults, prop) && hasOwn(options, prop) && options[prop] !== undefined) {
	      if (isObj(defaults[prop])) defaultArgs(defaults[prop], options[prop]);
	      else defaults[prop] = options[prop];
	    }
	  }
	  return defaults;
	}

	function createElm(html) {
	  const temp = document.createElement('div');
	  temp.innerHTML = html;
	  return temp.removeChild(temp.firstElementChild);
	}

	function insertCss(css) {
	  const style = document.createElement('style');
	  style.appendChild(document.createTextNode(css));
	  document.head.appendChild(style);
	  return style;
	}

	const messagePickerCss = `
body.purgecord-pick-message [data-list-id="chat-messages"] {
  background-color: var(--background-secondary-alt);
  box-shadow: inset 0 0 0px 2px var(--background-brand, var(--button-outline-brand-border));
}

body.purgecord-pick-message [id^="message-content-"]:hover {
  cursor: pointer;
  cursor: cell;
  background: var(--message-automod-background-hover, var(--background-message-automod-hover));
}
body.purgecord-pick-message [id^="message-content-"]:hover::after {
  position: absolute;
  top: calc(50% - 11px);
  left: 4px;
  z-index: 1;
  width: 65px;
  height: 22px;
  line-height: 22px;
  font-family: var(--font-display);
  background-color: var(--control-secondary-background-default, var(--button-secondary-background));
  color: var(--text-subtle, var(--header-secondary));
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  text-align: center;
  border-radius: 3px;
  content: 'This 👉';
}
body.purgecord-pick-message.before [id^="message-content-"]:hover::after {
  content: 'Before 👆';
}
body.purgecord-pick-message.after [id^="message-content-"]:hover::after {
  content: 'After 👇';
}
`;

	const messagePicker = {
	  init() {
	    insertCss(messagePickerCss);
	  },
	  grab(auxiliary) {
	    return new Promise((resolve) => {
	      document.body.classList.add('purgecord-pick-message');
	      if (auxiliary) document.body.classList.add(auxiliary);

	      function done(id) {
	        if (auxiliary) document.body.classList.remove(auxiliary);
	        document.body.classList.remove('purgecord-pick-message');
	        document.removeEventListener('click', clickHandler, true);
	        document.removeEventListener('keydown', keyHandler, true);
	        resolve(id);
	      }

	      function clickHandler(e) {
	        // Accept a click anywhere on the message row, not only on its text.
	        const message = e.target.closest('[id^="message-content-"], li[id^="chat-messages-"], [data-list-item-id^="chat-messages___"]');
	        if (!message) return;
	        e.preventDefault();
	        e.stopPropagation();
	        e.stopImmediatePropagation();
	        const id = message.id || message.getAttribute('data-list-item-id') || '';
	        const match = id.match(/(?:message-content-|chat-messages-\d+-|chat-messages___)(\d+)/);
	        done(match ? match[1] : null);
	      }

	      function keyHandler(e) {
	        if (e.key === 'Escape') done(null); // otherwise the handler leaks forever
	      }

	      document.addEventListener('click', clickHandler, true);
	      document.addEventListener('keydown', keyHandler, true);
	    });
	  }
	};
	window.messagePicker = messagePicker;

	/** Discord encrypts the stored token in the desktop app; that value is unusable here. */
	const ENCRYPTED_TOKEN_PREFIX = 'dQw4w9WgXcQ:';

	/**
	 * Discord deletes window.localStorage, but only the window reference — the
	 * origin's storage is untouched, so a throwaway same-origin iframe still
	 * exposes it.
	 */
	function readLocalStorage(keys) {
	  const iframe = document.createElement('iframe');
	  iframe.style.display = 'none';
	  document.body.appendChild(iframe);
	  try {
	    const storage = iframe.contentWindow.localStorage;
	    const values = {};
	    for (const key of keys) values[key] = storage[key];
	    return values; // read before the frame is detached, contentWindow dies with it
	  } catch (err) {
	    log.verb('Could not read local storage:', err);
	    return {};
	  } finally {
	    iframe.remove();
	  }
	}

	function parseStored(raw) {
	  if (raw === undefined || raw === null) return null;
	  try { return JSON.parse(raw); } catch { return null; }
	}

	function looksLikeToken(token) {
	  return typeof token === 'string' && token.length > 0 && !token.startsWith(ENCRYPTED_TOKEN_PREFIX);
	}

	/**
	 * Walk Discord's webpack module cache looking for a module that can hand us
	 * something. Used as a fallback because Discord removes the token from local
	 * storage whenever DevTools is open.
	 */
	function fromWebpack(pick) {
	  const chunks = window.webpackChunkdiscord_app;
	  if (!chunks || typeof chunks.push !== 'function') return null;

	  let found = null;
	  try {
	    // A unique chunk id, so we can never collide with a real one and mark it
	    // as already installed (which breaks the client).
	    chunks.push([[Symbol('purgecord')], {}, (require) => {
	      let modules;
	      try { modules = Object.values(require.c || {}); } catch { return; }
	      for (const module of modules) {
	        try {
	          const value = pick(module && module.exports);
	          if (value) { found = value; return; }
	        } catch { /* individual module getters can throw */ }
	      }
	    }]);
	  } catch (err) {
	    log.verb('Webpack lookup failed:', err);
	  } finally {
	    chunks.pop(); // don't leave our fake chunk behind
	  }
	  return found;
	}

	function getToken() {
	  const stored = parseStored(readLocalStorage(['token']).token);
	  if (looksLikeToken(stored)) return stored;

	  log.info('Could not read the Authorization Token from local storage, trying webpack...');
	  // The token module exports getToken directly; the auth store exposes it on
	  // default. Other modules (i18n) also have a getToken that returns an object,
	  // hence the string check.
	  const token = fromWebpack(exports => {
	    if (!exports) return null;
	    const source = (typeof exports.getToken === 'function' && exports)
	      || (exports.default && typeof exports.default.getToken === 'function' && exports.default);
	    if (!source) return null;
	    const value = source.getToken();
	    return looksLikeToken(value) ? value : null;
	  });

	  if (!token) throw new Error('Could not find the Authorization Token.');
	  return token;
	}

	function getAuthorId() {
	  const cached = parseStored(readLocalStorage(['user_id_cache']).user_id_cache);
	  if (isSnowflake(cached)) return String(cached);

	  const fromStore = fromWebpack(exports => {
	    const store = exports && exports.default;
	    if (!store || typeof store.getId !== 'function' || typeof store.getToken !== 'function') return null;
	    const id = store.getId();
	    return isSnowflake(id) ? String(id) : null;
	  });
	  if (fromStore) return fromStore;

	  log.error('Could not detect your User ID, please fill the "Author ID" field manually.');
	  return '';
	}

	function getGuildId() {
	  const m = location.href.match(/channels\/([\w@]+)\/(\d+)/);
	  if (m) return m[1];
	  alert('Could not find the Guild ID!\nPlease make sure you are on a Server or DM.');
	  return '';
	}

	function getChannelId() {
	  const m = location.href.match(/channels\/([\w@]+)\/(\d+)/);
	  if (m) return m[2];
	  alert('Could not find the Channel ID!\nPlease make sure you are on a Channel or DM.');
	  return '';
	}

	function fillToken() {
	  try {
	    return getToken();
	  } catch (err) {
	    log.verb(err);
	    log.error('Could not automatically detect Authorization Token!');
	    log.info('Please make sure Purgecord is up to date');
	    log.debug('Alternatively, you can try entering a Token manually in the "Advanced Settings" section.');
	  }
	  return '';
	}

	const PREFIX = '[PURGECORD]';

	// -------------------------- User interface ------------------------------- //

	// links
	const HOME = 'https://github.com/feelmypain/purgecord';
	const WIKI = 'https://github.com/feelmypain/purgecord'; // help links append a README anchor

	const purgecordCore = new PurgecordCore();
	messagePicker.init();

	const ui = {
	  purgecordWindow: null,
	  purgecordBtn: null,
	  logArea: null,
	  autoScroll: null,

	  // progress handler
	  progressMain: null,
	  progressIcon: null,
	  percent: null,
	};
	const $ = s => ui.purgecordWindow.querySelector(s);

	/**
	 * Find the channel header toolbar to hang the trash button off.
	 * Discord's CSS-module class names are `name_hash` / `name__hash`; the old
	 * `name-HASH` form is long gone, which is why the button stopped appearing.
	 * `toolbar_` (with the underscore) is used so we don't also match
	 * `toolbarContainer__…` in the user profile modal.
	 */
	function findToolbar() {
	  return document.querySelector('#app-mount [class*="upperContainer_"] [class*="toolbar_"]')
	    || document.querySelector('#app-mount section[class*="container_"] [class*="toolbar_"]')
	    || document.querySelector('#app-mount [class*="toolbar_"]')
	    || document.querySelector('#app-mount [class*="-toolbar"]'); // pre-2022 clients
	}

	let warnedAboutToolbar = false;
	function mountBtn() {
	  const toolbar = findToolbar();
	  if (toolbar) {
	    if (!toolbar.contains(ui.purgecordBtn)) toolbar.appendChild(ui.purgecordBtn);
	  }
	  else if (!warnedAboutToolbar) {
	    warnedAboutToolbar = true;
	    console.warn(PREFIX, 'Could not find the Discord toolbar to mount the button on. Open the window with: document.querySelector("#purgecord").style.display = ""');
	  }
	}

	function initUI() {

	  insertCss(themeCss);
	  insertCss(mainCss);
	  insertCss(dragCss);

	  // create purgecord window
	  const purgecordUI = replaceInterpolations(purgecordTemplate, {
	    VERSION,
	    HOME,
	    WIKI,
	  });
	  ui.purgecordWindow = createElm(purgecordUI);
	  document.body.appendChild(ui.purgecordWindow);

	  // enable drag and resize on purgecord window
	  new DragResize({ elm: ui.purgecordWindow, moveHandle: $('.header') });

	  // create purgecord Trash icon
	  ui.purgecordBtn = createElm(buttonHtml);
	  ui.purgecordBtn.onclick = toggleWindow;
	  mountBtn();
	  // Discord rebuilds the header bar on every channel switch, so keep checking.
	  // A plain interval is far cheaper than a subtree MutationObserver on #app-mount.
	  setInterval(() => {
	    if (!document.contains(ui.purgecordBtn)) mountBtn();
	  }, 1000);

	  function toggleWindow() {
	    if (ui.purgecordWindow.style.display !== 'none') {
	      ui.purgecordWindow.style.display = 'none';
	      ui.purgecordBtn.style.color = 'var(--interactive-icon-default, var(--interactive-normal))';
	    }
	    else {
	      ui.purgecordWindow.style.display = '';
	      ui.purgecordBtn.style.color = 'var(--interactive-icon-active, var(--interactive-active))';
	    }
	  }

	  // cached elements
	  ui.logArea = $('#logArea');
	  ui.autoScroll = $('#autoScroll');
	  ui.progressMain = $('#progressBar');
	  ui.progressIcon = ui.purgecordBtn.querySelector('progress');
	  ui.percent = $('#progressPercent');

	  // register event listeners
	  $('#hide').onclick = toggleWindow;
	  $('#toggleSidebar').onclick = ()=> ui.purgecordWindow.classList.toggle('hide-sidebar');
	  $('button#start').onclick = startAction;
	  $('button#stop').onclick = stopAction;
	  $('button#clear').onclick = () => ui.logArea.innerHTML = '';
	  // Only overwrite a field when we actually found something, otherwise a failed
	  // lookup wipes what the user typed (or stamps it with "undefined").
	  const fillField = (selector, value) => { if (value) $(selector).value = value; };
	  $('button#getAuthor').onclick = () => fillField('input#authorId', getAuthorId());
	  $('button#getGuild').onclick = () => {
	    const guildId = getGuildId();
	    fillField('input#guildId', guildId);
	    if (guildId === '@me') fillField('input#channelId', getChannelId());
	  };
	  $('button#getChannel').onclick = () => {
	    fillField('input#channelId', getChannelId());
	    fillField('input#guildId', getGuildId());
	  };
	  $('#redact').onchange = () => {
	    const b = ui.purgecordWindow.classList.toggle('redact');
	    if (b) alert('This mode will attempt to hide personal information, so you can screen share / take screenshots.\nAlways double check you are not sharing sensitive information!');
	  };
	  $('#pickMessageAfter').onclick = async () => {
	    alert('Select a message on the chat.\nThe message below it will be deleted.');
	    toggleWindow();
	    const id = await messagePicker.grab('after');
	    if (id) $('input#minId').value = id;
	    toggleWindow();
	  };
	  $('#pickMessageBefore').onclick = async () => {
	    alert('Select a message on the chat.\nThe message above it will be deleted.');
	    toggleWindow();
	    const id = await messagePicker.grab('before');
	    if (id) $('input#maxId').value = id;
	    toggleWindow();
	  };
	  $('button#getToken').onclick = () => fillField('input#token', fillToken());

	  // sync delays
	  $('input#searchDelay').onchange = (e) => {
	    const v = parseInt(e.target.value);
	    if (v) purgecordCore.options.searchDelay = v;
	  };
	  $('input#deleteDelay').onchange = (e) => {
	    const v = parseInt(e.target.value);
	    if (v) purgecordCore.options.deleteDelay = v;
	  };

	  $('input#searchDelay').addEventListener('input', (event) => {
	    $('div#searchDelayValue').textContent = event.target.value + 'ms';
	  });
	  $('input#deleteDelay').addEventListener('input', (event) => {
	    $('div#deleteDelayValue').textContent = event.target.value + 'ms';
	  });

	  // the labels are empty until the first drag, so seed them from the markup
	  $('div#searchDelayValue').textContent = $('input#searchDelay').value + 'ms';
	  $('div#deleteDelayValue').textContent = $('input#deleteDelay').value + 'ms';

	  // import json
	  const fileSelection = $('input#importJsonInput');
	  fileSelection.onchange = async () => {
	    const files = fileSelection.files;

	    // No files added
	    if (files.length === 0) return log.warn('No file selected.');

	    // Get channel id field to set it later
	    const channelIdField = $('input#channelId');

	    // Force the guild id to be ourself (@me)
	    const guildIdField = $('input#guildId');
	    guildIdField.value = '@me';

	    // Set author id in case its not set already
	    fillField('input#authorId', getAuthorId());
	    try {
	      const file = files[0];
	      const text = await file.text();
	      const json = JSON.parse(text);
	      const channelIds = Object.keys(json);
	      channelIdField.value = channelIds.join(',');
	      log.info(`Loaded ${channelIds.length} channels.`);
	    } catch(err) {
	      log.error('Error parsing file!', err);
	    }
	  };

	  // redirect console logs to inside the window after setting up the UI
	  setLogFn(printLog);

	  setupPurgecordCore();
	}

	/** Keep the log pane useful without letting a long run fill the DOM. */
	const MAX_LOG_LINES = 5000;

	function printLog(type = '', args) {
	  // String arguments come from this codebase and carry deliberate markup
	  // (redaction tags, <b>, <i>). Anything else is API data and gets escaped.
	  const line = Array.from(args).map(o => {
	    if (typeof o === 'object' && o !== null) return escapeHTML(JSON.stringify(o, o instanceof Error ? Object.getOwnPropertyNames(o) : undefined));
	    return o;
	  }).join('\t');

	  ui.logArea.insertAdjacentHTML('beforeend', `<div class="log log-${type}">${line}</div>`);

	  if (ui.logArea.childElementCount > MAX_LOG_LINES) {
	    while (ui.logArea.childElementCount > MAX_LOG_LINES) ui.logArea.firstElementChild.remove();
	    ui.logArea.insertAdjacentHTML('afterbegin', '<div class="log log-verb">[older lines trimmed]</div>');
	  }

	  if (ui.autoScroll.checked) ui.logArea.lastElementChild.scrollIntoView(false);
	  if (type === 'error') console.error(PREFIX, ...Array.from(args));
	}

	function setupPurgecordCore() {

	  purgecordCore.onStart = (state, stats) => {
	    console.log(PREFIX, 'onStart', state, stats);
	    $('#start').disabled = true;
	    $('#stop').disabled = false;

	    ui.purgecordBtn.classList.add('running');
	    ui.progressMain.style.display = 'block';
	    ui.percent.style.display = 'block';
	  };

	  purgecordCore.onProgress = (state, stats) => {
	    // console.log(PREFIX, 'onProgress', state, stats);
	    let max = state.grandTotal;
	    const value = state.delCount + state.failCount;
	    max = Math.max(max, value, 0); // clamp max

	    // status bar
	    const percent = value >= 0 && max ? Math.round(value / max * 100) + '%' : '';
	    const elapsed = msToHMS(Date.now() - stats.startTime.getTime());
	    const remaining = msToHMS(stats.etr);
	    // Show when we are pacing ourselves above the configured delay, instead of
	    // rewriting the user's slider behind their back.
	    const throttled = stats.deleteBackoff > 0 ? ` (throttled +${stats.deleteBackoff | 0}ms)` : '';
	    ui.percent.innerHTML = `${percent} (${value}/${max}) Elapsed: ${elapsed} Remaining: ${remaining}${throttled}`;

	    ui.progressIcon.value = value;
	    ui.progressMain.value = value;

	    // indeterminate progress bar
	    if (max) {
	      ui.progressIcon.setAttribute('max', max);
	      ui.progressMain.setAttribute('max', max);
	    } else {
	      ui.progressIcon.removeAttribute('value');
	      ui.progressMain.removeAttribute('value');
	      ui.percent.innerHTML = '...';
	    }
	  };

	  purgecordCore.onStop = (state, stats) => {
	    console.log(PREFIX, 'onStop', state, stats);
	    $('#start').disabled = false;
	    $('#stop').disabled = true;
	    ui.purgecordBtn.classList.remove('running');
	    ui.progressMain.style.display = 'none';
	    ui.percent.style.display = 'none';
	  };
	}

	async function startAction() {
	  console.log(PREFIX, 'startAction');
	  // Bail before resetState(), which would otherwise clear the flag the core
	  // checks and let a second delete loop run over the same state.
	  if (purgecordCore.busy) return log.error('Already running!');
	  // general
	  const authorId = $('input#authorId').value.trim();
	  const guildId = $('input#guildId').value.trim();
	  // An empty entry here used to survive as '' and turn a single-channel job
	  // into a server-wide delete, so drop the blanks.
	  const channelIds = $('input#channelId').value.split(/[\s,]+/).filter(Boolean);
	  const includeNsfw = $('input#includeNsfw').checked;
	  // filter
	  const content = $('input#search').value.trim();
	  const hasLink = $('input#hasLink').checked;
	  const hasFile = $('input#hasFile').checked;
	  const includePinned = $('input#includePinned').checked;
	  const pattern = $('input#pattern').value;
	  // message interval
	  const minId = $('input#minId').value.trim();
	  const maxId = $('input#maxId').value.trim();
	  // date range
	  const minDate = $('input#minDate').value.trim();
	  const maxDate = $('input#maxDate').value.trim();
	  //advanced
	  const searchDelay = parseInt($('input#searchDelay').value.trim()) || 2000;
	  const deleteDelay = parseInt($('input#deleteDelay').value.trim()) || 1000;

	  // token
	  const authToken = $('input#token').value.trim() || fillToken();
	  if (!authToken) return; // get token already logs an error.

	  // validate input
	  if (!guildId) return log.error('You must fill the "Server ID" field!');
	  if (guildId !== '@me' && !isSnowflake(guildId)) return log.error('"Server ID" must be a Discord id, or "@me" for direct messages.');
	  if (guildId === '@me' && channelIds.length === 0) return log.error('You must fill the "Channel ID" field to delete direct messages!');

	  const badChannelIds = channelIds.filter(id => !isSnowflake(id));
	  if (badChannelIds.length) return log.error('These are not valid Channel IDs:', escapeHTML(badChannelIds.join(', ')));

	  if (authorId && !isSnowflake(authorId)) return log.error('"Author ID" must be a Discord id.');
	  for (const [label, value] of [['After a message', minId], ['Before a message', maxId]]) {
	    if (value && !isSnowflake(value)) return log.error(`"${label}" must be a message id.`, escapeHTML(value));
	  }

	  // clear logArea
	  ui.logArea.innerHTML = '';

	  purgecordCore.resetState();
	  purgecordCore.options = {
	    ...purgecordCore.options,
	    authToken,
	    authorId,
	    guildId,
	    channelId: channelIds.length === 1 ? channelIds[0] : undefined, // single or multiple channel
	    minId: minId || minDate,
	    maxId: maxId || maxDate,
	    content,
	    hasLink,
	    hasFile,
	    includeNsfw,
	    includePinned,
	    pattern,
	    searchDelay,
	    deleteDelay,
	    // maxAttempt: 2,
	  };

	  try {
	    // multiple channels
	    if (channelIds.length > 1) {
	      const jobs = channelIds.map(ch => ({
	        guildId: guildId,
	        channelId: ch,
	      }));
	      await purgecordCore.runBatch(jobs);
	    }
	    // single channel (or the whole server, when no channel is given)
	    else {
	      await purgecordCore.run();
	    }
	  } catch (err) {
	    log.error('CoreException', escapeHTML(err && err.message || err));
	  } finally {
	    // run() unlocks the UI itself; this only covers a throw that escaped it.
	    if (purgecordCore.state.running) purgecordCore.stop();
	  }
	}

	function stopAction() {
	  console.log(PREFIX, 'stopAction');
	  purgecordCore.stop();
	}

	// ---- END Purgecord ----

	initUI();

})();
