import {describe,it,expect} from 'vitest';
import {normalizeLinkedIn,emailDomain,sortDirectory,profileSchema,onboardingSchema,emptyProfile,profileComplete,linkedInSuffix,LINKEDIN_PREFIX,findSpeakerProfile,participantBadges} from './networking';
describe('phase 2 rules',()=>{
 it('shows Organizer independently of Speaker without replacing it',()=>{
  expect(participantBadges({is_organizer:true,is_speaker:false})).toEqual(['organizer']);
  expect(participantBadges({is_organizer:true,is_speaker:true})).toEqual(['organizer','speaker']);
  expect(participantBadges({is_organizer:false,is_speaker:false})).toEqual([]);
 });
 it('uses the requested fixed LinkedIn prefix',()=>expect(LINKEDIN_PREFIX).toBe('https://www.linkedin.com/in/'));
 it('strips the prefix of a pasted full LinkedIn URL',()=>expect(linkedInSuffix('https://www.linkedin.com/in/camille-test')).toBe('camille-test'));
 it('keeps only the profile suffix without tracking parameters',()=>expect(linkedInSuffix('https://linkedin.com/in/camille-test/?trk=hello')).toBe('camille-test'));
 it('keeps a typed profile suffix',()=>expect(linkedInSuffix('camille-test')).toBe('camille-test'));
 it('normalizes protocol, www, case, parameters and trailing slash',()=>expect(normalizeLinkedIn('HTTPS://WWW.LinkedIn.com/in/Maxime/?trk=hello#x')).toBe('linkedin.com/in/maxime'));
 it('rejects impersonating domains',()=>expect(normalizeLinkedIn('https://linkedin.com.evil.test/in/maxime')).toBe(''));
 it('never attributes a speaker badge to an empty or non-standard LinkedIn URL',()=>{
  const speakers=[{id:'constance-nebbula',links:{linkedin:'fr.linkedin.com/in/constance-nebbula'}},{id:'real-speaker',links:{linkedin:'https://www.linkedin.com/in/camille-test'}}];
  expect(findSpeakerProfile('',speakers)).toBeUndefined();
  expect(findSpeakerProfile('https://www.linkedin.com/in/constance-nebbula',speakers)).toBeUndefined();
  expect(findSpeakerProfile('linkedin.com/in/camille-test',speakers)?.id).toBe('real-speaker');
 });
 it('finds exact lowercase sponsor domain',()=>expect(emailDomain(' Maxime@ExploreTheVault.ai ')).toBe('explorethevault.ai'));
 it('orders Platinum, Gold, Silver, standard then surname',()=>{const rows=[['Z','platinum'],['A',null],['B','gold'],['C','silver'],['A','platinum']].map(([last_name,tier])=>({last_name:last_name??'',first_name:'X',profile_status:{sponsor_tier:tier??null}}));expect(sortDirectory(rows).map(x=>x.last_name)).toEqual(['A','Z','B','C','A']);});
 const valid={...emptyProfile,email:'test@example.com',first_name:'A',last_name:'B',linkedin_url:'https://linkedin.com/in/test',job_tags:['tech_data'],intentions:['recruit']};
 it('keeps the editable city when validating a profile',()=>expect(profileSchema.parse({...valid,city:' Nantes '}).city).toBe('Nantes'));
 it('allows signup without a city',()=>expect(profileSchema.parse({...valid,city:null}).city).toBeNull());
 it('limits pitch to 160 characters',()=>{expect(profileSchema.safeParse({...valid,pitch:'x'.repeat(160)}).success).toBe(true);expect(profileSchema.safeParse({...valid,pitch:'x'.repeat(161)}).success).toBe(false);});
 it('allows onboarding without a LinkedIn URL',()=>expect(profileSchema.safeParse({...valid,linkedin_url:''}).success).toBe(true));
 it('still rejects a malformed LinkedIn URL',()=>expect(profileSchema.safeParse({...valid,linkedin_url:'https://example.com/in/x'}).success).toBe(false));
 it('requires a job tag at onboarding',()=>expect(onboardingSchema.safeParse({...valid,job_tags:[]}).success).toBe(false));
 it('accepts one job tag at onboarding',()=>expect(onboardingSchema.safeParse({...valid,job_tags:['tech_data']}).success).toBe(true));
 it('allows onboarding without job tags',()=>expect(profileSchema.safeParse({...valid,job_tags:[]}).success).toBe(true));
 it('skips onboarding for a completed profile',()=>expect(profileComplete({...valid,job_tags:[],consent_at:'2026-10-31T18:06:00Z'} as Parameters<typeof profileComplete>[0])).toBe(true));
 it('keeps onboarding for missing identity information',()=>expect(profileComplete({...valid,first_name:'',consent_at:'2026-10-31T18:06:00Z'} as Parameters<typeof profileComplete>[0])).toBe(false));
 it('keeps onboarding until explicit consent',()=>expect(profileComplete({...valid,consent_at:null} as Parameters<typeof profileComplete>[0])).toBe(false));
 it('requires at least one intention',()=>expect(profileSchema.safeParse({...valid,intentions:[]}).success).toBe(false));
 it('does not require AI level or pitch',()=>expect(profileSchema.safeParse(valid).success).toBe(true));
 it('requires explicit consent',()=>expect(profileSchema.safeParse({...valid,consent:false}).success).toBe(false));
});