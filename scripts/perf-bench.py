"""Measures studio frame rate with the simulation running, under CPU throttling, so regressions show up on a fast machine.

Serve a production build first:  npm run build  then  python -m http.server 4190 --directory dist
Run (needs Python with Playwright and a local Chrome):
    python scripts/perf-bench.py [--port 4190] [--throttle 6] [--runs 3] [--pause] [--drag]

Baseline recorded 2026-11-11 (ecommerce-distributed template, 1832x904, 6x throttle):
    simulation running  idle: about 8-12 fps
    simulation paused   idle: about 48-58 fps
Node drag (--drag), simulation running, 6x throttle: before the drag fix about 8 fps, after about 15 fps
Noise: the same build varies by roughly +-30% between runs, so compare variants interleaved and over many runs.
Tried without a measurable gain (2026-11-11): moving packets out of React state (imperative transform writes).
"""
import argparse

from playwright.sync_api import sync_playwright

RAF = """() => { window.__ft = []; let last = performance.now();
  const loop = t => { window.__ft.push(t - last); last = t; if (window.__run) requestAnimationFrame(loop); };
  window.__run = true; requestAnimationFrame(loop); }"""


def one_run(a):
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=a.chrome, headless=True)
        pg = b.new_page(viewport={'width': 1832, 'height': 904})
        pg.goto(f'http://localhost:{a.port}/?studio=1&template=ecommerce-distributed', wait_until='networkidle')
        pg.wait_for_timeout(800)
        skip = pg.get_by_role('button', name='Skip')
        if skip.count():
            skip.first.click()
            pg.wait_for_timeout(400)
        if a.no_dash:
            pg.add_style_tag(content='.animate-flow-dash{animation:none!important}')
        if a.no_blur:
            pg.add_style_tag(content='*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}')
        if a.css:
            pg.add_style_tag(content=a.css)
        if a.pause:
            pg.get_by_label('Pause Traffic').click()
        cdp = pg.context.new_cdp_session(pg)
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': a.throttle})
        cdp.send('Performance.enable')
        pg.wait_for_timeout(800)
        pg.evaluate(RAF)
        before = {m['name']: m['value'] for m in cdp.send('Performance.getMetrics')['metrics']}
        t0 = before['Timestamp']
        if a.drag:
            # canvas nodes are absolutely positioned; the first plain cursor-grab match is a palette item
            box = pg.locator('[class*=absolute][class*=cursor-grab]').first.bounding_box()
            cx, cy = box['x'] + box['width'] / 2, box['y'] + 20
            pg.mouse.move(cx, cy)
            pg.mouse.down()
            for i in range(90):
                pg.mouse.move(cx + i * 4, cy + (i % 40) * 3)
                pg.wait_for_timeout(16)
            pg.mouse.up()
        else:
            pg.wait_for_timeout(3500)
        after = {m['name']: m['value'] for m in cdp.send('Performance.getMetrics')['metrics']}
        ft = pg.evaluate('() => { window.__run = false; return window.__ft; }')[5:]
        b.close()
    wall = after['Timestamp'] - t0
    # main-thread busy share per wall second, split by kind (script / style recalc / layout)
    share = {k: (after[k] - before[k]) / wall * 100 for k in ('TaskDuration', 'ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration')}
    return 1000 / (sum(ft) / len(ft)), share


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=4190)
    ap.add_argument('--throttle', type=int, default=6)
    ap.add_argument('--runs', type=int, default=3)
    ap.add_argument('--pause', action='store_true', help='pause the simulation first (upper bound)')
    ap.add_argument('--drag', action='store_true', help='drag a node instead of idling')
    ap.add_argument('--no-dash', action='store_true', help='experiment: disable the edge dash animation')
    ap.add_argument('--css', default='', help='experiment: extra CSS injected before measuring')
    ap.add_argument('--no-blur', action='store_true', help='experiment: disable backdrop-filter everywhere')
    ap.add_argument('--chrome', default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
    a = ap.parse_args()
    runs = [one_run(a) for _ in range(a.runs)]
    fps = [r[0] for r in runs]
    mode = ('paused' if a.pause else 'running') + (', drag' if a.drag else ', idle')
    print(f'simulation {mode}, {a.throttle}x throttle: ' + ' / '.join(f'{f:.1f}' for f in fps) + ' fps')
    avg = {k: sum(r[1][k] for r in runs) / len(runs) for k in runs[0][1]}
    print('main thread busy %: ' + ', '.join(f'{k.replace("Duration", "")} {v:.0f}' for k, v in avg.items()))


if __name__ == '__main__':
    main()
