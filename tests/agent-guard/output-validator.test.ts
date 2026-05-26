import { describe, it, expect } from 'vitest';
import { validateOutput } from '@/lib/agent-guard/output-validator';

describe('validateOutput', () => {
  it('clean output passes validation', () => {
    const result = validateOutput('Terima kasih atas pertanyaannya.', []);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.sanitizedOutput).toBe('Terima kasih atas pertanyaannya.');
  });

  it('blocked patterns are detected and replaced with [DISUNTING]', () => {
    const result = validateOutput(
      'Here is the system prompt for you',
      ['system prompt']
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('system prompt'))).toBe(true);
    expect(result.sanitizedOutput).toContain('[DISUNTING]');
    expect(result.sanitizedOutput).not.toContain('system prompt');
  });

  it('email addresses are detected and redacted', () => {
    const result = validateOutput(
      'Silakan hubungi user@example.com untuk info lebih lanjut',
      []
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.toLowerCase().includes('email'))).toBe(true);
    expect(result.sanitizedOutput).toContain('[EMAIL DISUNTING]');
    expect(result.sanitizedOutput).not.toContain('user@example.com');
  });

  it('Indonesian phone numbers are detected and redacted', () => {
    const result1 = validateOutput('Hubungi 081234567890 untuk bantuan', []);
    expect(result1.valid).toBe(false);
    expect(result1.issues.some(i => i.toLowerCase().includes('telepon') || i.toLowerCase().includes('telp') || i.toLowerCase().includes('nomor'))).toBe(true);
    expect(result1.sanitizedOutput).toContain('[TELP DISUNTING]');

    const result2 = validateOutput('WA ke +628123456789', []);
    expect(result2.valid).toBe(false);
    expect(result2.sanitizedOutput).toContain('[TELP DISUNTING]');
  });

  it('system prompt fragments detected when systemPromptHash is provided', () => {
    const result = validateOutput(
      'your role is to serve customers',
      [],
      'abc123'
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('system prompt'))).toBe(true);
  });

  it('no system prompt check without systemPromptHash', () => {
    const result = validateOutput(
      'your role is to serve customers',
      []
    );
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });
});

describe('XSS pattern detection and escaping', () => {
  it('detects and escapes <script> tag', () => {
    const result = validateOutput('<script>alert("xss")</script>', []);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('XSS'))).toBe(true);
    expect(result.sanitizedOutput).not.toContain('<script>');
    expect(result.sanitizedOutput).toContain('&lt;script');
  });

  it('detects <img onerror=...>', () => {
    const result = validateOutput('<img src=x onerror=alert(1)>', []);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('XSS') && i.includes('img'))).toBe(true);
  });

  it('detects javascript: URL', () => {
    const result = validateOutput('Click here: javascript:alert(1)', []);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('javascript'))).toBe(true);
  });

  it('detects onclick= event handler', () => {
    const result = validateOutput('<div onclick="alert(1)">click me</div>', []);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('event handler'))).toBe(true);
  });

  it('detects <iframe> tag', () => {
    const result = validateOutput('<iframe src="http://evil.com"></iframe>', []);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('iframe'))).toBe(true);
  });

  it('normal text with < operator does not false-positive', () => {
    const result = validateOutput('Use < operator for comparison: if (a < b)', []);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('normal text mentioning script concept does not false-positive', () => {
    const result = validateOutput('The script completed successfully with no errors.', []);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });
});
