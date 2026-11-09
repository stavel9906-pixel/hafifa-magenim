import { createHash } from 'node:crypto';
import {
  buildSoapEnvelope,
  continuousMoveBody,
  escapeXml,
  passwordDigest,
  stopBody,
} from '../../../../src/camera/utils/onvif.utils.js';

const nonce = Buffer.from('0123456789abcdef');
const now = new Date('2026-11-09T12:00:00.000Z');

describe('passwordDigest', () => {
  it('is base64(sha1(nonce + created + password))', () => {
    const expected = createHash('sha1')
      .update(
        Buffer.concat([
          nonce,
          Buffer.from('2026-11-09T12:00:00.000Z'),
          Buffer.from('secret'),
        ]),
      )
      .digest('base64');

    expect(passwordDigest(nonce, '2026-11-09T12:00:00.000Z', 'secret')).toBe(
      expected,
    );
  });
});

describe('buildSoapEnvelope', () => {
  it('adds a WS-Security digest header without the plain password', () => {
    const xml = buildSoapEnvelope(
      '<tptz:Stop/>',
      { username: 'admin', password: 'secret' },
      now,
      nonce,
    );

    expect(xml).toContain('<Username>admin</Username>');
    expect(xml).toContain(passwordDigest(nonce, now.toISOString(), 'secret'));
    expect(xml).toContain(`<Nonce EncodingType=`);
    expect(xml).toContain('<s:Body><tptz:Stop/></s:Body>');
    expect(xml).not.toContain('secret');
  });

  it('omits the security header without a username', () => {
    const xml = buildSoapEnvelope(
      '<tptz:Stop/>',
      { username: '', password: '' },
      now,
      nonce,
    );

    expect(xml).not.toContain('<s:Header>');
  });

  it('escapes the username', () => {
    expect(escapeXml(`a<b>&"'`)).toBe('a&lt;b&gt;&amp;&quot;&apos;');
  });
});

describe('PTZ bodies', () => {
  it('builds a pan-only continuous move', () => {
    expect(continuousMoveBody(-0.5)).toContain('<tt:PanTilt x="-0.5" y="0"/>');
    expect(continuousMoveBody(0.5)).toContain(
      '<tptz:ProfileToken>MainStream</tptz:ProfileToken>',
    );
  });

  it('stops pan, tilt and zoom', () => {
    expect(stopBody()).toContain('<tptz:PanTilt>true</tptz:PanTilt>');
    expect(stopBody()).toContain('<tptz:Zoom>true</tptz:Zoom>');
  });
});
