import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns an ok status and an ISO timestamp', () => {
    const result = new HealthService().getHealth();

    expect(result.status).toBe('ok');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
