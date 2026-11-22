import { describe, it, expect } from 'bun:test';
import { healthInsights } from './retro-summary';
const T = ['A','B','C'];
describe('healthInsights', () => {
  it('lists topics differing by 2+ points, biggest first', () => {
    const r = healthInsights([5,3,1],[1,2,3],T,null);
    expect(r.gaps.map(g => g.title)).toEqual(['A','C']);
  });
  it('averages only when all topics are answered', () => {
    expect(healthInsights([4,4,null],[],T,null).average).toBeNull();
    expect(healthInsights([4,4,1],[],T,null).average).toBe(3);
  });
  it('trend compares with the previous retro', () => {
    expect(healthInsights([4,4,4],[],T,[3,3,3]).trend).toBe(1);
  });
  it('next steps come from Ideas lines', () => {
    expect(healthInsights([],[],[],null,{ plan:'• Kino\n• Wandern', try:'' }).nextSteps).toEqual(['Kino','Wandern']);
  });
});
