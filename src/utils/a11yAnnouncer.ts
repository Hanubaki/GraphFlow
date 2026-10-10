/**
 * WCAG 2.1 AA Screen Reader Live Region Announcer.
 * Provides accessible, debounced polite announcements for visually impaired users.
 */

export class A11yAnnouncer {
  private liveElement: HTMLElement | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  private getOrCreateElement(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    if (this.liveElement && document.body.contains(this.liveElement)) {
      return this.liveElement;
    }

    const existing = document.getElementById('graphflow-a11y-live-region');
    if (existing) {
      this.liveElement = existing;
      return existing;
    }

    const el = document.createElement('div');
    el.id = 'graphflow-a11y-live-region';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    // Visually hidden (screen-reader only styling)
    el.style.position = 'absolute';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.padding = '0';
    el.style.margin = '-1px';
    el.style.overflow = 'hidden';
    el.style.clip = 'rect(0, 0, 0, 0)';
    el.style.whiteSpace = 'nowrap';
    el.style.border = '0';

    document.body.appendChild(el);
    this.liveElement = el;
    return el;
  }

  public getLiveElement(): HTMLElement | null {
    return this.getOrCreateElement();
  }

  public announce(message: string, delayMs = 50): void {
    const el = this.getOrCreateElement();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      if (el) {
        // Clear then set to guarantee screen-reader detection
        el.textContent = '';
        setTimeout(() => {
          if (el) el.textContent = message;
        }, 20);
      }
    }, delayMs);
  }

  public announceNodeSelected(title: string, subtitle?: string): void {
    this.announce(`Selected component ${title}${subtitle ? ` (${subtitle})` : ''}`);
  }

  public announceNodeMoved(title: string, x: number, y: number): void {
    this.announce(`Moved ${title} to coordinate X ${x}, Y ${y}`);
  }

  public announceAction(action: string): void {
    this.announce(action);
  }
}

export const a11yAnnouncer = new A11yAnnouncer();
