import { describe, it, expect, beforeEach, vi } from 'vitest';
import { telemetry, TelemetryPayload } from '../utils/telemetry';
import { translations } from '../i18n/translations';
import { getNestedTranslation } from '../i18n/I18nContext';

describe('Analytics Telemetry & I18n Localization Suite', () => {
  beforeEach(() => {
    telemetry.clearHistory();
  });

  describe('1. Privacy-First Telemetry Engine', () => {
    it('records valid events conforming to Object-Action taxonomy', () => {
      telemetry.track('Node Created', { type: 'gateway', canvasNodeCount: 3 });
      telemetry.track('Simulation Toggled', { isRunning: true, speedMultiplier: 1.5 });

      const history = telemetry.getHistory();
      expect(history.length).toBe(2);

      expect(history[0].name).toBe('Node Created');
      expect(history[0].properties.type).toBe('gateway');
      expect(history[0].properties.canvasNodeCount).toBe(3);
      expect(typeof history[0].timestamp).toBe('number');

      expect(history[1].name).toBe('Simulation Toggled');
      expect(history[1].properties.isRunning).toBe(true);
      expect(history[1].properties.speedMultiplier).toBe(1.5);
    });

    it('strictly sanitizes and scrubs PII from telemetry properties', () => {
      telemetry.track('Checkout Clicked', {
        tier: 'pro',
        source: 'topbar',
        userEmail: 'user@example.com',
        userToken: 'secret_jwt_token_123',
        passwordHash: 'argon2id_hash',
      });

      const history = telemetry.getHistory();
      expect(history.length).toBe(1);

      const props = history[0].properties;
      expect(props.tier).toBe('pro');
      expect(props.source).toBe('topbar');

      // PII must be completely removed
      expect((props as any).userEmail).toBeUndefined();
      expect((props as any).userToken).toBeUndefined();
      expect((props as any).passwordHash).toBeUndefined();
    });

    it('dispatches non-blocking notifications to registered subscribers', () => {
      const received: TelemetryPayload[] = [];
      const unsubscribe = telemetry.subscribe(event => {
        received.push(event);
      });

      telemetry.track('Modal Opened', { modalName: 'export' });
      expect(received.length).toBe(1);
      expect(received[0].properties.modalName).toBe('export');

      unsubscribe();
      telemetry.track('Modal Opened', { modalName: 'pricing' });
      expect(received.length).toBe(1); // Unsubscribed, should not increase
    });
  });

  describe('2. I18n Catalogs & Nested Resolution', () => {
    it('contains matching keys in both English and Turkish dictionaries', () => {
      expect(translations.en.topbar.appName).toBe('GraphFlow');
      expect(translations.tr.topbar.appName).toBe('GraphFlow');

      expect(translations.en.topbar.export).toBe('Export');
      expect(translations.tr.topbar.export).toBe('Dışa Aktar');

      expect(translations.en.topbar.pauseTraffic).toBe('Pause Traffic');
      expect(translations.tr.topbar.pauseTraffic).toBe('Trafiği Duraklat');

      expect(translations.en.palette.categories.compute).toBe('Compute & Routing');
      expect(translations.tr.palette.categories.compute).toBe('İşlem & Yönlendirme');
    });

    it('resolves nested dot-notation paths correctly via getNestedTranslation', () => {
      const enTitle = getNestedTranslation(translations.en, 'topbar.spikeTitle');
      expect(enTitle).toBe('Inject Traffic Surge / DDoS');

      const trTitle = getNestedTranslation(translations.tr, 'topbar.spikeTitle');
      expect(trTitle).toBe('Trafik Dalgalanması / DDoS Enjekte Et');
    });

    it('returns null gracefully for non-existent paths', () => {
      const invalid = getNestedTranslation(translations.en, 'topbar.nonExistentKey');
      expect(invalid).toBeNull();
    });
  });
});
