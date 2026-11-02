import {describe,expect,it} from 'vitest';
import {domainFromWebsite,desiredSponsorDomains} from './sponsor-domains';
describe('domainFromWebsite',()=>{
  it('strips scheme and www',()=>expect(domainFromWebsite('https://www.cloudflare.com/')).toBe('cloudflare.com'));
  it('strips path',()=>expect(domainFromWebsite('https://brijyt.ai/fr')).toBe('brijyt.ai'));
  it('strips language prefix',()=>expect(domainFromWebsite('https://fr.ippon.tech/')).toBe('ippon.tech'));
  it('excludes linkedin',()=>expect(domainFromWebsite('https://www.linkedin.com/showcase/leboncoin-tech/')).toBeNull());
  it('excludes gmail',()=>expect(domainFromWebsite('gmail.com')).toBeNull());
  it('returns null when empty',()=>expect(domainFromWebsite('')).toBeNull());
});
describe('desiredSponsorDomains',()=>{
  it('skips generic and non-tier sponsors',()=>expect(desiredSponsorDomains([{id:'brijyt',tier:'silver',website:'https://brijyt.ai/fr'},{id:'leboncoin',tier:'silver',website:'https://www.linkedin.com/x'},{id:'x',tier:'partner',website:'https://x.io'}])).toEqual([{domain:'brijyt.ai',sponsor_id:'brijyt',tier:'silver'}]));
});
