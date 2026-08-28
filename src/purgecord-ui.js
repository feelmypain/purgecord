const PREFIX = '[PURGECORD]';

import { VERSION } from 'process.env';

import themeCss from './ui/theme.css';
import mainCss from './ui/main.css';
import dragCss from './ui/drag.css';
import buttonHtml from './ui/purgecord-button.html';
import purgecordTemplate from './ui/purgecord.html';

import PurgecordCore from './purgecord-core';
import { buildPurgePlan } from './purgecord-plan.js';
import Drag from './utils/drag';
import createElm from './utils/createElm';
import insertCss from './utils/insertCss';
import messagePicker from './utils/messagePicker';
import { getAuthorId, getGuildId, getGuildIds, fetchGuildIds, getChannelId, fillToken } from './utils/getIds';

import { log, setLogFn } from './utils/log.js';
import { replaceInterpolations, msToHMS, escapeHTML, isSnowflake } from './utils/helpers';

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
  new Drag({ elm: ui.purgecordWindow, moveHandle: $('.header') });

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
  let loadingGuilds = false;
  $('button#getGuilds').onclick = async () => {
    if (purgecordCore.busy) return log.error('Stop the current run before loading the server list.');
    if (loadingGuilds) return;
    loadingGuilds = true;
    try {
      let guildIds = getGuildIds();
      if (!guildIds.length) {
        const authToken = $('input#token').value.trim() || fillToken();
        if (!authToken) return;
        guildIds = await fetchGuildIds(authToken);
      }
      if (!guildIds.length) return;

      $('input#guildId').value = guildIds.join(',');
      $('input#channelId').value = '';
      if (!$('input#authorId').value.trim()) fillField('input#authorId', getAuthorId());
      log.info(`Loaded ${guildIds.length} servers. Channel ID was cleared so every server is purged in full.`);
    } finally {
      loadingGuilds = false;
    }
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
  let plan;
  try {
    plan = buildPurgePlan($('input#guildId').value, $('input#channelId').value);
  } catch (err) {
    return log.error(escapeHTML(err && err.message || err));
  }
  const { guildIds, jobs } = plan;
  const { guildId, channelId } = jobs[0];
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


  if (authorId && !isSnowflake(authorId)) return log.error('"Author ID" must be a Discord id.');
  if (guildIds.length > 1 && !authorId) {
    return log.error('"Author ID" is required when purging multiple servers. Click "me" to use your own account.');
  }
  for (const [label, value] of [['After a message', minId], ['Before a message', maxId]]) {
    if (value && !isSnowflake(value)) return log.error(`"${label}" must be a message id.`, escapeHTML(value));
  }
  // token
  const authToken = $('input#token').value.trim() || fillToken();
  if (!authToken) return; // get token already logs an error.

  // clear logArea
  ui.logArea.innerHTML = '';

  purgecordCore.resetState();
  purgecordCore.options = {
    ...purgecordCore.options,
    authToken,
    authorId,
    guildId,
    channelId,
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
    if (jobs.length > 1) await purgecordCore.runBatch(jobs);
    else await purgecordCore.run();
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

export default initUI;

// ---- END Purgecord ----