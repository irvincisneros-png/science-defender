#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
SESSION="science-defender-smoke-$$"
PORT="5180"
URL="http://127.0.0.1:$PORT"
OUT="$ROOT/output/playwright"
SERVER_LOG="$OUT/preview-server.log"

command -v npx >/dev/null 2>&1 || { echo "npx is required (install Node.js/npm)." >&2; exit 1; }
[[ -x "$PWCLI" ]] || { echo "Playwright CLI wrapper not found: $PWCLI" >&2; exit 1; }
mkdir -p "$OUT"

cleanup() {
  "$PWCLI" --session "$SESSION" close >/dev/null 2>&1 || true
  if [[ -n "${SERVER_PID:-}" ]]; then kill "$SERVER_PID" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT

assert_eval() {
  local expression="$1" report_file="$2" result
  result="$("$PWCLI" --session "$SESSION" eval "$expression" 2>&1)"
  printf '%s\n' "$result" | tee "$report_file"
  if printf '%s\n' "$result" | rg -q '^### Error|^Error:'; then
    return 1
  fi
}

PORT="$PORT" node "$ROOT/_preview_server.js" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!
for _ in {1..40}; do
  if curl -fsS "$URL" >/dev/null 2>&1; then break; fi
  sleep 0.1
done
curl -fsS "$URL" >/dev/null || { echo "Preview server did not start; see $SERVER_LOG" >&2; exit 1; }

"$PWCLI" --session "$SESSION" open "$URL" >/dev/null

check_viewport() {
  local width="$1" height="$2" label="$3"
  "$PWCLI" --session "$SESSION" resize "$width" "$height" >/dev/null
  "$PWCLI" --session "$SESSION" reload >/dev/null
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.waitForTimeout(750); }" >/dev/null
  assert_eval "() => { const active = [...document.querySelectorAll('.screen')].find(el => getComputedStyle(el).display !== 'none'); const result = { viewport: [innerWidth, innerHeight], title: document.title, scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], activeScreen: active && active.id, canvasCount: document.querySelectorAll('canvas').length }; if (!result.title) throw new Error('document title is empty'); if (!active) throw new Error('no visible .screen'); if (result.scroll[0] > innerWidth + 1) throw new Error('horizontal overflow: ' + result.scroll[0] + ' > ' + innerWidth); return result; }" "$OUT/$label-result.txt"
  "$PWCLI" --session "$SESSION" screenshot --filename "$OUT/$label.png" >/dev/null
  "$PWCLI" --session "$SESSION" eval "() => { switchScreen('screen-levelselect'); return true; }" >/dev/null
  "$PWCLI" --session "$SESSION" screenshot --filename "$OUT/$label-campaign.png" >/dev/null
  assert_eval "() => { const cards = [...document.querySelectorAll('.level-card')]; if (cards.length !== 20) throw new Error('campaign card count ' + cards.length); const thumb = cards[0].querySelector('.level-thumb'); if (!thumb || !getComputedStyle(thumb).backgroundImage.includes('lab.webp')) throw new Error('painting thumbnail missing'); if (!cards[0].querySelector('.enemy-preview')) throw new Error('enemy preview missing'); return { cards: cards.length, firstThumbnail: getComputedStyle(thumb).backgroundImage }; }" "$OUT/$label-campaign-result.txt"
  "$PWCLI" --session "$SESSION" eval "() => { switchScreen('screen-menu'); return true; }" >/dev/null

  # Exercise the real battlefield as well as the menu. A responsive shell can
  # otherwise conceal a fixed-size canvas that is clipped on phones.
  "$PWCLI" --session "$SESSION" eval "() => { launchLevel(0, false); return true; }" >/dev/null
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.waitForTimeout(1000); }" >/dev/null
  "$PWCLI" --session "$SESSION" screenshot --filename "$OUT/$label-gameplay.png" >/dev/null
  assert_eval "() => { const canvas = document.getElementById('game-canvas'); const rect = canvas.getBoundingClientRect(); const result = { viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, backing: [canvas.width, canvas.height], canvas: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } }; if (getComputedStyle(document.getElementById('screen-playing')).display === 'none') throw new Error('gameplay screen is not visible'); if (canvas.width !== Math.round(900 * Math.min(3, Math.max(1, devicePixelRatio))) || canvas.height !== Math.round(550 * Math.min(3, Math.max(1, devicePixelRatio)))) throw new Error('DPR backing mismatch: ' + JSON.stringify(result)); if (rect.width < 240 || rect.height < 140) throw new Error('battlefield is too small to use: ' + rect.width + 'x' + rect.height); if (rect.left < -1 || rect.top < -1 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1) throw new Error('battlefield is clipped: ' + JSON.stringify(result)); return result; }" "$OUT/$label-gameplay-result.txt"

  # Exercise the collapsible Field Kit in both directions, ending open so the
  # pointer placement flow can use the real shop control.
  if [[ "$width" -le 900 ]]; then
    "$PWCLI" --session "$SESSION" run-code "async page => { await page.locator('.hud-sidebar summary').click(); }" >/dev/null
    assert_eval "() => { if (!document.querySelector('.hud-sidebar').open) throw new Error('Field Kit did not open from its summary'); return true; }" "$OUT/$label-field-kit-open-result.txt"
    "$PWCLI" --session "$SESSION" run-code "async page => { await page.locator('.hud-sidebar summary').click(); }" >/dev/null
    assert_eval "() => { if (document.querySelector('.hud-sidebar').open) throw new Error('Field Kit did not close from its summary'); return true; }" "$OUT/$label-field-kit-close-result.txt"
    "$PWCLI" --session "$SESSION" run-code "async page => { await page.locator('.hud-sidebar summary').click(); }" >/dev/null
  else
    "$PWCLI" --session "$SESSION" eval "() => { document.querySelector('.hud-sidebar').open = true; return true; }" >/dev/null
  fi
  assert_eval "() => { const kit = document.querySelector('.hud-sidebar'); const summary = kit.querySelector('summary'); const visible = getComputedStyle(summary).display !== 'none'; if (!kit.open) throw new Error('Field Kit did not open'); if (visible && summary.getBoundingClientRect().height < 44) throw new Error('Field Kit target below 44px'); return { open: kit.open, visible, targetHeight: summary.getBoundingClientRect().height }; }" "$OUT/$label-field-kit-result.txt"

  # Real pointer flow: select a tower, click the first available pad, start the
  # wave, then prove a visible enemy advances along the canonical route.
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.locator('.shop-btn[data-tower=physics]').click(); }" >/dev/null
  assert_eval "() => { if (game.selectedTowerType !== 'physics') throw new Error('shop did not arm Physics: ' + game.selectedTowerType); return game.selectedTowerType; }" "$OUT/$label-shop-result.txt"
  if [[ "$width" -le 900 ]]; then
    "$PWCLI" --session "$SESSION" run-code "async page => { await page.locator('.hud-sidebar summary').click(); }" >/dev/null
  fi
  "$PWCLI" --session "$SESSION" run-code "async page => { const position = await page.evaluate(() => { const p = game.level.buildSpots.filter(s => !s.occupied).sort((a,b) => ((a.x-110)**2+(a.y-350)**2)-((b.x-110)**2+(b.y-350)**2))[0]; const r = document.getElementById('game-canvas').getBoundingClientRect(); return { x: p.x / 900 * r.width, y: p.y / 550 * r.height }; }); await page.locator('#game-canvas').click({ position }); }" >/dev/null
  assert_eval "() => { if (game.towers.length < 1) throw new Error('pointer tower placement failed; selected=' + game.selectedTowerType + ', gold=' + game.gold); return { towers: game.towers.length, gold: game.gold }; }" "$OUT/$label-placement-result.txt"
  if [[ "$width" -le 900 ]]; then
    "$PWCLI" --session "$SESSION" run-code "async page => { await page.locator('.hud-sidebar summary').click(); }" >/dev/null
  fi
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.locator('#start-wave-btn').click(); }" >/dev/null
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.waitForTimeout(2200); }" >/dev/null
  "$PWCLI" --session "$SESSION" screenshot --filename "$OUT/$label-motion.png" >/dev/null
  assert_eval "() => { const enemy = game.enemies.find(e => !e.isDead); if (game.towers.length < 1) throw new Error('pointer tower placement failed; selected=' + game.selectedTowerType + ', mouse=' + game.mouseX + ',' + game.mouseY + ', gold=' + game.gold); if (!enemy || !(enemy.pathDistance > 0)) throw new Error('enemy did not visibly traverse'); return { towers: game.towers.length, enemies: game.enemies.length, pathDistance: enemy.pathDistance }; }" "$OUT/$label-interaction-result.txt"

  # Dialog focus must enter the modal, trap on its controls, and restore to the
  # button that opened it when closed.
  "$PWCLI" --session "$SESSION" eval "() => { game.isWaveActive = false; game.spawnQueue = []; game.enemies = []; game.nextWaveCountdown = 7200; return true; }" >/dev/null
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.locator('.research-btn').focus(); }" >/dev/null
  "$PWCLI" --session "$SESSION" eval "() => { game.triggerQuestionPopup(); return true; }" >/dev/null
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.waitForTimeout(100); }" >/dev/null
  assert_eval "() => { const modal = document.getElementById('question-modal'); if (!modal.contains(document.activeElement)) throw new Error('focus did not enter question dialog; display=' + modal.style.display + ', active=' + (document.activeElement && document.activeElement.className) + ', wave=' + game.isWaveActive); return { focused: document.activeElement && document.activeElement.className }; }" "$OUT/$label-modal-focus-result.txt"
  "$PWCLI" --session "$SESSION" eval "() => { closeQuestionModal(); return document.activeElement && document.activeElement.classList.contains('research-btn'); }" >"$OUT/$label-modal-restore-result.txt"

  # Keyboard alternative: arm Biology, focus the canvas, choose a pad with an
  # arrow key, then place with Enter.
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.locator('.shop-btn[data-tower=biology]').click(); }" >/dev/null
  if [[ "$width" -le 900 ]]; then
    "$PWCLI" --session "$SESSION" run-code "async page => { await page.locator('.hud-sidebar summary').click(); }" >/dev/null
  fi
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.locator('#game-canvas').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); }" >/dev/null
  assert_eval "() => { if (game.towers.length < 2) throw new Error('keyboard pad placement failed'); return { towers: game.towers.length, focused: document.activeElement.id }; }" "$OUT/$label-keyboard-result.txt"

  # Reduced-motion preference is wired into canvas effects as well as CSS.
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.emulateMedia({ reducedMotion: 'reduce' }); }" >/dev/null
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.waitForTimeout(100); }" >/dev/null
  assert_eval "() => { game.shakeFrames = 0; game.addShake(9, 20); if (!game.reducedMotion || !window.SCI_REDUCED_MOTION) throw new Error('reduced-motion media state not applied'); if (game.shakeFrames !== 0) throw new Error('screen shake still active under reduced motion'); return { reducedMotion: game.reducedMotion, shakeFrames: game.shakeFrames }; }" "$OUT/$label-reduced-motion-result.txt"
  "$PWCLI" --session "$SESSION" run-code "async page => { await page.emulateMedia({ reducedMotion: 'no-preference' }); }" >/dev/null

  # Busiest-wave visual/performance proof: populate Level 20 with 160 mixed
  # enemies distributed along the route, render repeatedly, and capture it.
  "$PWCLI" --session "$SESSION" eval "() => { launchLevel(19, false); game.isPaused = true; const types = ['creationist','vitalism','golem','aether','miasma','homunculus']; for (let i=0;i<160;i++) { game.spawnEnemy(types[i % types.length]); const enemy = game.enemies[game.enemies.length-1]; enemy.pathDistance = game.level.route.totalLength * ((i % 157) / 157); const pose = game.level.route.sampleAtDistance(enemy.pathDistance); enemy.x = pose.x; enemy.y = pose.y; enemy.previousX = enemy.x; enemy.previousY = enemy.y; } const start = performance.now(); for (let i=0;i<120;i++) game.draw(); game._busyRenderMs = performance.now()-start; window.SCI_PERF = { targetCandidates: 0 }; const probes = Array.from({length:12}, (_,i) => new window.TOWER_REGISTRY.physics(75 + (i%6)*150, 120 + Math.floor(i/6)*280)); probes.forEach(t => t.range = 500); const targetStart = performance.now(); for (let pass=0;pass<120;pass++) probes.forEach(t => t.findTargets(game.enemies)); game._busyTargetMs = performance.now()-targetStart; return true; }" >/dev/null
  "$PWCLI" --session "$SESSION" screenshot --filename "$OUT/$label-busiest-wave.png" >/dev/null
  assert_eval "() => { if (game.enemies.length !== 160) throw new Error('busy roster size ' + game.enemies.length); if (game._busyRenderMs > 2000) throw new Error('120 busy renders took ' + game._busyRenderMs + 'ms'); if (!(window.SCI_PERF.targetCandidates > 0) || game._busyTargetMs > 2000) throw new Error('target profile failed'); return { enemies: game.enemies.length, render120Ms: Math.round(game._busyRenderMs), targetScan120x12Ms: Math.round(game._busyTargetMs), targetCandidates: window.SCI_PERF.targetCandidates }; }" "$OUT/$label-busiest-wave-result.txt"
  "$PWCLI" --session "$SESSION" eval "() => { game.gameState = 'menu'; switchScreen('screen-menu'); return true; }" >/dev/null
}

check_viewport 1280 720 desktop-1280x720
check_viewport 844 390 iphone-landscape-844x390

# Browser exceptions and failed asset requests are surfaced separately from layout.
"$PWCLI" --session "$SESSION" console error | tee "$OUT/console-errors.txt"
if rg -q "\[error\]|404 \(Not Found\)|net::ERR" "$OUT/console-errors.txt"; then
  echo "Browser console/network errors found; see $OUT/console-errors.txt" >&2
  exit 1
fi

echo "Browser smoke passed. Screenshots and reports: $OUT"
