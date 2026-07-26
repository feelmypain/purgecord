import insertCss from './insertCss';

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

export default messagePicker;
window.messagePicker = messagePicker;