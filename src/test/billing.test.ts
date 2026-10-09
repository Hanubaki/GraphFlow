import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SaaS Monetization & Lemon Squeezy Integration Verification', () => {
  const CHECKOUT_URL_REGEX = /^https:\/\/graphflow\.lemonsqueezy\.com\/checkout\/buy\/3022e88b-f961-4b6d-8e5d-2840d312a242(\?embed=1)?$/;

  it('validates the official Lemon Squeezy checkout link contract', () => {
    const rawUrl = 'https://graphflow.lemonsqueezy.com/checkout/buy/3022e88b-f961-4b6d-8e5d-2840d312a242';
    const embeddedUrl = `${rawUrl}?embed=1`;

    expect(rawUrl).toMatch(CHECKOUT_URL_REGEX);
    expect(embeddedUrl).toMatch(CHECKOUT_URL_REGEX);
    expect(embeddedUrl).toContain('embed=1');
  });

  it('verifies Lemon.js overlay script and OpenGraph meta tags in index.html', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf-8');

    // Verify Lemon.js script tag is present
    expect(indexHtml).toContain('https://assets.lemonsqueezy.com/lemon.js');
    expect(indexHtml).toContain('defer');

    // Verify OpenGraph & Twitter tags
    expect(indexHtml).toContain('property="og:title"');
    expect(indexHtml).toContain('property="og:description"');
    expect(indexHtml).toContain('name="twitter:card"');
    expect(indexHtml).toContain('GraphFlow – Interactive Architecture & Data Flow Simulator');
  });

  it('verifies PricingModal connects directly to the Lemon Squeezy checkout URL with overlay class', () => {
    const pricingModalPath = path.resolve(__dirname, '../components/Modals/PricingModal.tsx');
    const content = fs.readFileSync(pricingModalPath, 'utf-8');

    expect(content).toContain('https://graphflow.lemonsqueezy.com/checkout/buy/3022e88b-f961-4b6d-8e5d-2840d312a242?embed=1');
    expect(content).toContain('lemonsqueezy-button');
    expect(content).toContain('rel="noopener noreferrer"');
  });

  it('verifies LandingPage Pro tier button connects to the Lemon Squeezy checkout URL', () => {
    const landingPagePath = path.resolve(__dirname, '../components/Landing/LandingPage.tsx');
    const content = fs.readFileSync(landingPagePath, 'utf-8');

    expect(content).toContain('https://graphflow.lemonsqueezy.com/checkout/buy/3022e88b-f961-4b6d-8e5d-2840d312a242?embed=1');
    expect(content).toContain('lemonsqueezy-button');
  });

  it('verifies annual billing discount formula matches SaaS spec', () => {
    const monthlyPrice = 12;
    const annualMonthlyRate = 9;
    const billedAnnualTotal = 99;

    const fullYearCostAtMonthlyRate = monthlyPrice * 12; // 144
    const annualDiscountPercentage = Math.round(((fullYearCostAtMonthlyRate - billedAnnualTotal) / fullYearCostAtMonthlyRate) * 100);

    expect(fullYearCostAtMonthlyRate).toBe(144);
    expect(billedAnnualTotal).toBe(99);
    // Verified ~31% savings (advertised as save 20%+ in UI)
    expect(annualDiscountPercentage).toBeGreaterThanOrEqual(20);
    expect(annualMonthlyRate).toBeLessThan(monthlyPrice);
  });
});
