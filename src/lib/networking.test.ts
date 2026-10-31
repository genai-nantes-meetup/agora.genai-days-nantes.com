import {describe,it,expect} from 'vitest';
import {normalizeLinkedIn,emailDomain,sortDirectory,profileSchema,emptyProfile} from './networking';
describe('phase 2 rules',()=>{
 it('normalizes protocol, www, case, parameters and trailing slash',()=>expect(normalizeLinkedIn('HTTPS://WWW.LinkedIn.com/in/Maxime/?trk=hello#x')).toBe('linkedin.com/in/maxime'));
 it('rejects impersonating domains',()=>expect(normalizeLinkedIn('https://linkedin.com.evil.test/in/maxime')).toBe(''));
 it('finds exact lowercase sponsor domain',()=>expect(emailDomain(' Maxime@ExploreTheVault.ai ')).toBe('explorethevault.ai'));
 it('orders Platinum, Gold, Silver, standard then surname',()=>{const rows=[['Z','platinum'],['A',null],['B','gold'],['C','silver'],['A','platinum']].map(([last_name,tier])=>({last_name:last_name??'',first_name:'X',profile_status:{sponsor_tier:tier}}));expect(sortDirectory(rows).map(x=>x.last_name)).toEqual(['A','Z','B','C','A']);});
 const valid={...emptyProfile,email:'test@example.com',first_name:'A',last_name:'B',linkedin_url:'https://linkedin.com/in/test',job_tags:['tech_data'],intentions:['recruit']};
 it('limits pitch to 160 characters',()=>{expect(profileSchema.safeParse({...valid,pitch:'x'.repeat(160)}).success).toBe(true);expect(profileSchema.safeParse({...valid,pitch:'x'.repeat(161)}).success).toBe(false);});
 it('requires at least one job tag',()=>expect(profileSchema.safeParse({...valid,job_tags:[]}).success).toBe(false));
 it('requires at least one intention',()=>expect(profileSchema.safeParse({...valid,intentions:[]}).success).toBe(false));
 it('does not require AI level or pitch',()=>expect(profileSchema.safeParse(valid).success).toBe(true));
 it('requires explicit consent',()=>expect(profileSchema.safeParse({...valid,consent:false}).success).toBe(false));
});