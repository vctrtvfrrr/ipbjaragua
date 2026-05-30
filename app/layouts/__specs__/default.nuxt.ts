import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import DefaultLayout from '../default.vue';
import SiteHeader from '../../components/SiteHeader.vue';

describe('default layout', () => {
  it('renders the global site header', async () => {
    const wrapper = await mountSuspended(DefaultLayout);
    expect(wrapper.findComponent(SiteHeader).exists()).toBe(true);
  });
});
