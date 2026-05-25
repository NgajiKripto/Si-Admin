import { describe, it, expect } from 'vitest';
import { classifyScope } from '@/lib/agent-guard/scope-classifier';

describe('classifyScope', () => {
  it('matching topic returns inScope:true', () => {
    const result = classifyScope('berapa harga produk ini?', ['harga', 'produk']);
    expect(result.inScope).toBe(true);
  });

  it('no matching topic returns inScope:false', () => {
    const result = classifyScope('ceritakan tentang politik', ['produk', 'harga']);
    expect(result.inScope).toBe(false);
  });

  it('word boundary: "produksi" does NOT match "produk" keyword', () => {
    const result = classifyScope('proses produksi kami', ['produk']);
    expect(result.inScope).toBe(false);
  });

  it('confidence is a number between 0 and 1', () => {
    const result = classifyScope('berapa harga produk ini?', ['harga', 'produk']);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('empty input returns inScope:false with confidence 0', () => {
    const result = classifyScope('', ['harga', 'produk']);
    expect(result.inScope).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it('custom topics without predefined keywords fall back to topic name as keyword', () => {
    const result = classifyScope('saya ingin tanya tentang custom_topic_word', ['custom_topic_word']);
    expect(result.inScope).toBe(true);
    expect(result.detectedTopic).toBe('custom_topic_word');
  });
});
