/* mediatastelibrary.page
 *
 * The only behaviour on this page is the grid toggle, which is the
 * swiss-grid-lab signature move. Deliberately no rAF loop, no scroll
 * listener, no observer: the skill's honesty gate says reduced-motion must
 * gate the loop itself, and the cheapest way to pass that gate is to not
 * open one. Motion is short stock-eased CSS transitions, killed outright by
 * the prefers-reduced-motion block in styles.css.
 *
 * State persists so the grid stays where you left it; the button is a real
 * <button> with aria-pressed, so it works from the keyboard with no extra
 * handler — that is why there is no keydown code here.
 */
(function () {
  var KEY = 'mtl:grid';
  var btn = document.querySelector('[data-grid-toggle]');
  var overlay = document.querySelector('[data-grid]');
  if (!btn || !overlay) return;

  function paint(on) {
    overlay.hidden = !on;
    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('.pill__tx').textContent = on ? 'ON' : 'OFF';
  }

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  paint(stored === '1');

  btn.addEventListener('click', function () {
    var on = btn.getAttribute('aria-pressed') !== 'true';
    paint(on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
  });
})();
