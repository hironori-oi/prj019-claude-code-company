/**
 * PRJ-019 W7-A KPI Dashboard skeleton — unit tests (R31 Dev-LLL)
 *
 * Coverage: 12 case
 *   - getKpiSnapshot() shape (5)
 *   - KPI rendering presence (4)
 *   - mode='dry-run' guard (2)
 *   - aria-label structure (1)
 *
 * Constraints:
 *   - mock data only / API call $0 / no fetch.
 *   - Vitest + @testing-library/react conventions.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage, { getKpiSnapshot } from '../page';

describe('PRJ-019 W7-A KPI dashboard skeleton', () => {
  describe('getKpiSnapshot()', () => {
    it('returns mode=dry-run', () => {
      expect(getKpiSnapshot().mode).toBe('dry-run');
    });

    it('exposes latency p50/p95/p99 numeric ms', () => {
      const s = getKpiSnapshot();
      expect(typeof s.latency.p50_ms).toBe('number');
      expect(typeof s.latency.p95_ms).toBe('number');
      expect(typeof s.latency.p99_ms).toBe('number');
    });

    it('latency p50 <= p95 <= p99 ordering invariant', () => {
      const { p50_ms, p95_ms, p99_ms } = getKpiSnapshot().latency;
      expect(p50_ms).toBeLessThanOrEqual(p95_ms);
      expect(p95_ms).toBeLessThanOrEqual(p99_ms);
    });

    it('error_rate_pct is non-negative', () => {
      expect(getKpiSnapshot().error_rate_pct).toBeGreaterThanOrEqual(0);
    });

    it('availability_pct is between 0 and 100 inclusive', () => {
      const a = getKpiSnapshot().availability_pct;
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(100);
    });
  });

  describe('rendering', () => {
    it('renders the dashboard heading', () => {
      render(<DashboardPage />);
      expect(
        screen.getByRole('heading', { name: /Clawbridge KPI Dashboard/i }),
      ).toBeTruthy();
    });

    it('renders Latency p50 / p95 / p99 cards', () => {
      render(<DashboardPage />);
      expect(screen.getByText(/Latency p50/i)).toBeTruthy();
      expect(screen.getByText(/Latency p95/i)).toBeTruthy();
      expect(screen.getByText(/Latency p99/i)).toBeTruthy();
    });

    it('renders Error rate / Availability / Cost cards', () => {
      render(<DashboardPage />);
      expect(screen.getByText(/Error rate/i)).toBeTruthy();
      expect(screen.getByText(/Availability/i)).toBeTruthy();
      expect(screen.getByText(/Cost \(24h\)/i)).toBeTruthy();
    });

    it('renders Custom signal card', () => {
      render(<DashboardPage />);
      expect(screen.getByText(/Custom signal/i)).toBeTruthy();
    });
  });

  describe('mode guard', () => {
    it('does not display mode=live in dry-run skeleton', () => {
      render(<DashboardPage />);
      expect(screen.queryByText(/mode=live/)).toBeNull();
    });

    it('shows mode=dry-run banner literal', () => {
      render(<DashboardPage />);
      expect(screen.getByText(/dry-run/)).toBeTruthy();
    });
  });

  describe('a11y', () => {
    it('declares aria-label sections for latency / reliability / custom', () => {
      const { container } = render(<DashboardPage />);
      const labels = Array.from(
        container.querySelectorAll('section[aria-label]'),
      ).map((el) => el.getAttribute('aria-label'));
      expect(labels).toContain('latency');
      expect(labels).toContain('reliability-and-cost');
      expect(labels).toContain('custom');
    });
  });
});
