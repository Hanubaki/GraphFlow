"""Records the ~40 s launch demo of the live GraphFlow studio as a silent, captioned .webm.

Requires Python with Playwright and a local Chrome:
    python scripts/record-demo.py [--url URL] [--out DIR] [--chrome PATH]

Scenario: traffic flows -> traffic surge -> slow the ledger DB -> take it down -> recover.
"""
import argparse
import glob
import os

from playwright.sync_api import sync_playwright

W, H = 1600, 900
CAPTION_JS = """(t) => {
  let el = document.getElementById('__cap');
  if (!el) {
    el = document.createElement('div'); el.id = '__cap';
    const s = el.style;
    s.position = 'fixed'; s.left = '50%'; s.bottom = '36px'; s.transform = 'translateX(-50%)';
    s.zIndex = '99999'; s.padding = '12px 22px'; s.borderRadius = '12px';
    s.background = 'rgba(8,9,10,0.92)'; s.border = '1px solid #35373c'; s.color = '#f7f8f8';
    s.font = '600 22px "Mona Sans", system-ui, sans-serif'; s.pointerEvents = 'none';
    document.body.appendChild(el);
  }
  el.textContent = t;
}"""
CURSOR_JS = """() => {
  const c = document.createElement('div');
  const s = c.style;
  s.position = 'fixed'; s.width = '18px'; s.height = '18px'; s.borderRadius = '50%';
  s.background = 'rgba(34,211,238,0.85)'; s.border = '2px solid #08090a'; s.zIndex = '100000';
  s.pointerEvents = 'none'; s.left = '-40px'; s.top = '-40px'; s.transform = 'translate(-50%,-50%)';
  document.body.appendChild(c);
  document.addEventListener('mousemove', e => { s.left = e.clientX + 'px'; s.top = e.clientY + 'px'; }, true);
}"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', default='https://graph-flow-virid.vercel.app/?template=stripe-webhook-ledger')
    ap.add_argument('--out', default='demo-out')
    ap.add_argument('--chrome', default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=a.chrome, headless=True)
        ctx = browser.new_context(
            viewport={'width': W, 'height': H},
            record_video_dir=a.out,
            record_video_size={'width': W, 'height': H},
        )
        pg = ctx.new_page()
        pg.goto(a.url, wait_until='networkidle')
        pg.wait_for_timeout(1200)
        skip = pg.get_by_role('button', name='Skip')
        if skip.count():
            skip.first.click()
        pg.get_by_label('Reset zoom and auto-center architecture').click()
        pg.evaluate(CURSOR_JS)

        def say(text, wait_ms):
            pg.evaluate(CAPTION_JS, text)
            pg.wait_for_timeout(wait_ms)

        def click(locator):
            box = locator.first.bounding_box()
            pg.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2, steps=30)
            pg.wait_for_timeout(250)
            locator.first.click()

        say('A system design diagram. This one runs.', 4500)
        say('Real traffic flows through every connection.', 4500)

        say('Inject a traffic surge.', 600)
        click(pg.get_by_label('Inject Traffic Surge / DDoS'))
        pg.wait_for_timeout(5500)
        click(pg.get_by_label('Inject Traffic Surge / DDoS'))  # toggle the surge off

        click(pg.get_by_text('Immutable Ledger DB'))
        say('Slow the database down by 100 ms.', 600)
        click(pg.get_by_text('+100ms'))
        pg.wait_for_timeout(5500)

        say('Then take it down.', 600)
        click(pg.get_by_role('button', name='Down', exact=True))
        pg.wait_for_timeout(6000)

        say('Bring it back and watch it recover.', 600)
        click(pg.get_by_role('button', name='Healthy', exact=True))
        click(pg.get_by_role('button', name='Closed (Pass)', exact=True))
        pg.wait_for_timeout(5000)

        say('No install, no sign-in. graph-flow-virid.vercel.app', 4000)
        ctx.close()
        browser.close()

    videos = sorted(glob.glob(os.path.join(a.out, '*.webm')), key=os.path.getmtime)
    print('recorded:', videos[-1], os.path.getsize(videos[-1]), 'bytes')


if __name__ == '__main__':
    main()
