import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import BulletinIndex from '../BulletinIndex.vue';

describe('BulletinIndex', () => {
  it('links each bulletin to its detail route under /bulletins', async () => {
    const wrapper = await mountSuspended(BulletinIndex, {
      props: { bulletins: ['2026-05-17'] },
    });

    const link = wrapper.get('a');
    expect(link.attributes('href')).toBe('/bulletins/2026-05-17');
  });
});
