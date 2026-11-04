/**
 * KVKK, GDPR, e-Commerce Distance Sales & 72-Hour Data Breach Incident Logger
 */

export interface SecurityIncidentRecord {
  incidentId: string;
  category: 'webhook_signature_failure' | 'rate_limit_abuse' | 'unauthorized_access' | 'data_breach_suspected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAtIso: string;
  notificationDeadline72hIso: string;
  sourceIpMasked: string;
  summary: string;
  notifiedAuthorityContact: string;
}

const incidentBuffer: SecurityIncidentRecord[] = [];

export function maskIpAddress(ip: string): string {
  const clean = (ip || '0.0.0.0').trim();
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }
  return clean.slice(0, 6) + '***';
}

/**
 * Records a security or personal data incident with an automatic 72-hour KVKK/GDPR
 * authority notification deadline and structured alert payload.
 */
export function logSecurityIncident72h(
  category: SecurityIncidentRecord['category'],
  severity: SecurityIncidentRecord['severity'],
  rawIp: string,
  summary: string
): SecurityIncidentRecord {
  const nowMs = Date.now();
  const hours72Ms = 72 * 60 * 60 * 1000;
  const record: SecurityIncidentRecord = {
    incidentId: `INC-${nowMs.toString(36).toUpperCase()}`,
    category,
    severity,
    detectedAtIso: new Date(nowMs).toISOString(),
    notificationDeadline72hIso: new Date(nowMs + hours72Ms).toISOString(),
    sourceIpMasked: maskIpAddress(rawIp),
    summary,
    notifiedAuthorityContact: 'berkeakdemir5855@gmail.com (KVKK Veri Sorumlusu İrtibat / 72s Kuralı)',
  };

  incidentBuffer.push(record);
  if (incidentBuffer.length > 100) {
    incidentBuffer.shift();
  }

  if (severity === 'high' || severity === 'critical') {
    console.error('[KVKK-72H-BREACH-ALERT]', JSON.stringify(record));
  }

  return record;
}

export function getRecentSecurityIncidents(): readonly SecurityIncidentRecord[] {
  return [...incidentBuffer];
}

export interface UserConsentState {
  kvkkNoticeAcknowledged: boolean;
  explicitCloudSyncConsent: boolean;
  commercialIysConsent: boolean;
  preCheckoutDistanceSalesConsent: boolean;
  updatedAtIso: string;
}

export const CONSENT_STORAGE_KEY = 'graphflow_kvkk_consent_v1';

export function saveUserConsentState(consent: Partial<UserConsentState>): UserConsentState {
  const current = loadUserConsentState();
  const next: UserConsentState = {
    ...current,
    ...consent,
    updatedAtIso: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  }
  return next;
}

export function loadUserConsentState(): UserConsentState {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as UserConsentState;
      }
    } catch {
      // ignore malformed storage
    }
  }
  return {
    kvkkNoticeAcknowledged: false,
    explicitCloudSyncConsent: false,
    commercialIysConsent: false,
    preCheckoutDistanceSalesConsent: false,
    updatedAtIso: new Date(0).toISOString(),
  };
}

/**
 * Guard before any future commercial email/SMS campaign dispatch (IYS compliance).
 */
export function canSendCommercialMessage(consent: Pick<UserConsentState, 'commercialIysConsent'>): boolean {
  return Boolean(consent.commercialIysConsent);
}
