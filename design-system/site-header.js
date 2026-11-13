/* NELIO — behaviour of the site header (SiteHeader). Plain script, no dependencies.
   Include it once in <head>: <script src="site-header.js"></script>
   It marks the page with the class n-js right away, so the menu collapses behind the Menu button
   below breakpoint-md; without this script the menu stays open and reachable. It then finds every
   header.n-header and wires its button.n-menu-btn and the links in its nav.n-nav (see the README). */
(function () {
  'use strict';
  document.documentElement.classList.add('n-js');

  function init() {
    document.querySelectorAll('header.n-header').forEach(function (header) {
      menu(header);
      scrollspy(header);
    });
  }

  // Menu button: opens and closes the panel below the header bar, and keeps aria-expanded in step.
  function menu(header) {
    var toggle = header.querySelector('.n-menu-btn');
    if (!toggle) return;
    function setOpen(open) {
      header.toggleAttribute('data-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { setOpen(!header.hasAttribute('data-open')); });
    header.querySelectorAll('.n-nav a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.hasAttribute('data-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // Active item: the link to the section just below the header gets aria-current="location".
  // Nothing is marked where no linked section is under the header, such as in the hero.
  function scrollspy(header) {
    var spied = new Map();
    header.querySelectorAll('.n-nav a[href*="#"]').forEach(function (link) {
      var section = samePage(link) && document.getElementById(link.hash.slice(1));
      if (section) spied.set(section, link);
    });
    if (!spied.size) return;
    var paused = false, queued = false, settle = 0;

    function mark(active) {
      spied.forEach(function (link) {
        if (link === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    // The line sits just below the header: where a clicked section lands (scroll-padding-top),
    // or lower when the open menu covers that spot. Everything is measured on the spot,
    // so a wrong reading corrects itself at the next scroll.
    function sync() {
      queued = false;
      if (paused) return;
      var landing = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      var line = Math.max(landing, header.getBoundingClientRect().bottom) + 2;
      var active;
      spied.forEach(function (link, section) {
        var box = section.getBoundingClientRect();
        if (box.top <= line && box.bottom > line) active = link;
      });
      mark(active);
    }
    // At most one measurement per frame, however fast the page scrolls.
    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sync);
    }
    // Capture, so scrolling inside any element counts too, not only the page.
    document.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    header.addEventListener('click', schedule);
    schedule();

    // After a click on a link to a section on this page, mark its menu item right away (none when
    // the section isn't in the menu) and pause until the scroll ends, so the underline doesn't
    // flash through the sections in between.
    function resume() {
      paused = false;
      window.clearTimeout(settle);
      document.removeEventListener('scroll', waitForScroll, true);
      document.removeEventListener('scrollend', resume, true);
      sync();
    }
    function waitForScroll() {
      window.clearTimeout(settle);
      settle = window.setTimeout(resume, 150);
    }
    document.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest && event.target.closest('a[href*="#"]');
      var target = link && samePage(link) && document.getElementById(link.hash.slice(1));
      if (!target) return;
      paused = true;
      mark(spied.get(target));
      document.addEventListener('scroll', waitForScroll, { capture: true, passive: true });
      document.addEventListener('scrollend', resume, true);
      waitForScroll();
    });
  }

  function samePage(link) {
    return link.href.split('#')[0] === location.href.split('#')[0];
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
