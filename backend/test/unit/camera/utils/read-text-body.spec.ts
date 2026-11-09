import { Readable } from 'node:stream';
import { readTextBody } from '../../../../src/camera/utils/read-text-body.js';

describe('readTextBody', () => {
  it('joins the chunks into a UTF-8 string', async () => {
    const stream = Readable.from([Buffer.from('v=0\r\n'), Buffer.from('o=-')]);

    await expect(readTextBody(stream, 100)).resolves.toBe('v=0\r\no=-');
  });

  it('rejects a body larger than the limit', async () => {
    const stream = Readable.from([Buffer.alloc(6), Buffer.alloc(6)]);

    await expect(readTextBody(stream, 10)).rejects.toThrow('larger than 10');
  });
});
