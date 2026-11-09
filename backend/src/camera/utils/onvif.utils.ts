import { createHash, randomBytes } from 'node:crypto';
import { ONVIF_PROFILE_TOKEN } from '../constants/camera.constants.js';
import type { OnvifCredentials } from '../types/onvif-credentials.js';

const WSSE =
  'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd';
const WSU =
  'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd';
const PASSWORD_DIGEST =
  'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest';
const BASE64 =
  'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary';

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function passwordDigest(
  nonce: Buffer,
  created: string,
  password: string,
): string {
  return createHash('sha1')
    .update(Buffer.concat([nonce, Buffer.from(created), Buffer.from(password)]))
    .digest('base64');
}

export function buildSoapEnvelope(
  body: string,
  credentials: OnvifCredentials,
  now = new Date(),
  nonce = randomBytes(16),
): string {
  const created = now.toISOString();
  const header = credentials.username
    ? `<s:Header><Security s:mustUnderstand="1" xmlns="${WSSE}"><UsernameToken>` +
      `<Username>${escapeXml(credentials.username)}</Username>` +
      `<Password Type="${PASSWORD_DIGEST}">${passwordDigest(nonce, created, credentials.password)}</Password>` +
      `<Nonce EncodingType="${BASE64}">${nonce.toString('base64')}</Nonce>` +
      `<Created xmlns="${WSU}">${created}</Created>` +
      `</UsernameToken></Security></s:Header>`
    : '';
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" ' +
    'xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl" ' +
    'xmlns:tt="http://www.onvif.org/ver10/schema">' +
    `${header}<s:Body>${body}</s:Body></s:Envelope>`
  );
}

export function continuousMoveBody(panSpeed: number): string {
  return (
    `<tptz:ContinuousMove><tptz:ProfileToken>${ONVIF_PROFILE_TOKEN}</tptz:ProfileToken>` +
    `<tptz:Velocity><tt:PanTilt x="${panSpeed}" y="0"/></tptz:Velocity>` +
    '</tptz:ContinuousMove>'
  );
}

export function stopBody(): string {
  return (
    `<tptz:Stop><tptz:ProfileToken>${ONVIF_PROFILE_TOKEN}</tptz:ProfileToken>` +
    '<tptz:PanTilt>true</tptz:PanTilt><tptz:Zoom>true</tptz:Zoom></tptz:Stop>'
  );
}
