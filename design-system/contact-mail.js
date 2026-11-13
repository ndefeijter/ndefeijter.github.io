/* NELIO — behaviour of the mail prompt (ContactMail). Plain script, no dependencies.
   Include it once, anywhere: <script src="contact-mail.js" defer></script>
   It shows every button.n-mail__copy, which stays hidden without this script or where the browser
   can't write to the clipboard (only over https). A click copies the address in data-copy, shows a
   check for a moment and puts the text of data-copied-label in the span.n-mail__status next to it,
   so a screen reader announces it (see the README). */
(function () {
  'use strict';

  function init() {
    if (!navigator.clipboard || !window.isSecureContext) return;
    document.querySelectorAll('.n-mail__copy[data-copy]').forEach(copyButton);
  }

  function copyButton(button) {
    var status = button.closest('.n-mail') && button.closest('.n-mail').querySelector('.n-mail__status');
    var timer;
    button.hidden = false;
    button.addEventListener('click', function () {
      navigator.clipboard.writeText(button.getAttribute('data-copy')).then(function () {
        button.setAttribute('data-copied', '');
        if (status) status.textContent = button.getAttribute('data-copied-label') || '';
        clearTimeout(timer);
        timer = setTimeout(function () {
          button.removeAttribute('data-copied');
          if (status) status.textContent = '';
        }, 2000);
      }).catch(function () {
        // No permission or the page lost focus: nothing to confirm; the link still works.
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
