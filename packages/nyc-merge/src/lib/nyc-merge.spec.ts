import { nycMerge } from './nyc-merge.js';

describe('nycMerge', () => {
  it('should work', () => {
    expect(nycMerge()).toEqual('nyc-merge');
  });
});
