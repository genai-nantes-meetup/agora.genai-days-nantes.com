import {describe,it,expect} from 'vitest';
import {staffSize,feedbackOpen,purgeAllowed,feedbackInput,tagsSchema,pitchSchema,iceSchema,filtersSchema,fillEmpty,parseAirscalePerson} from './rules';
import {parseInvites,exportCsv} from './csv';
describe('Phase 4 concrete rules',()=>{
 it('maps exact staff boundaries',()=>{expect([0,9,10,249,250,4999,5000].map(staffSize)).toEqual(['tpe','tpe','pme','pme','eti','eti','grand_groupe']);expect(staffSize(null)).toBeNull();});
 it('preserves fields already entered',()=>{expect(fillEmpty({first_name:'Camille',company:''},{first_name:'Other',company:'Example'})).toEqual({first_name:'Camille',company:'Example'});});
 it('opens only at Paris session start',()=>{expect(feedbackOpen('2026-11-17','08:30',new Date('2026-11-17T07:29:59Z'))).toBe(false);expect(feedbackOpen('2026-11-17','08:30',new Date('2026-11-17T07:30:00Z'))).toBe(true);});
 it('limits comments to 500 characters',()=>{expect(feedbackInput.safeParse({session_id:'s',choices:['actionable'],comment:'x'.repeat(500)}).success).toBe(true);expect(feedbackInput.safeParse({session_id:'s',choices:['actionable'],comment:'x'.repeat(501)}).success).toBe(false);});
 it('accepts only the six stable feedback choices',()=>{expect(feedbackInput.safeParse({session_id:'s',choices:['commercial'],comment:''}).success).toBe(false);});
 it('proposes one to three closed-list tags',()=>{expect(tagsSchema.safeParse({tags:['tech_data']}).success).toBe(true);expect(tagsSchema.safeParse({tags:['vip']}).success).toBe(false);expect(tagsSchema.safeParse({tags:['tech_data','hr_training','product_design','business_sales']}).success).toBe(false);});
 it('rejects pitch longer than 160',()=>{expect(pitchSchema.safeParse({pitch:'a'.repeat(160)}).success).toBe(true);expect(pitchSchema.safeParse({pitch:'a'.repeat(161)}).success).toBe(false);});
 it('requires exactly two icebreakers',()=>{expect(iceSchema.safeParse({messages:['Hello','Hi']}).success).toBe(true);expect(iceSchema.safeParse({messages:['Hello']}).success).toBe(false);});
 it('rejects filters outside closed lists',()=>{expect(filtersSchema.safeParse({intentions:[],tags:[],level:'wizard',size:null,sector:null,status:null}).success).toBe(false);});
 it('purges no earlier than 17 December midnight Paris',()=>{expect(purgeAllowed(new Date('2026-12-16T22:59:59Z'),false,2)).toBe(false);expect(purgeAllowed(new Date('2026-12-16T23:00:00Z'),false,2)).toBe(true);});
 it('paused purge never runs',()=>{expect(purgeAllowed(new Date('2026-12-17T00:00:00Z'),true,2)).toBe(false);});
 it('requires two retained admins',()=>{expect(purgeAllowed(new Date('2026-12-17T00:00:00Z'),false,1)).toBe(false);});
 it('CSV import deduplicates normalized email and parses quoted names',()=>{expect(parseInvites('E-mail;Prénom;Nom;Identifiant\nA@example.com;"Camille; A";Test;42\na@example.com;Camille;Test;42')).toEqual([{email:'a@example.com',first_name:'Camille',last_name:'Test',billetweb_ref:'42'}]);});
 it('CSV export neutralizes spreadsheet formula injection',()=>{expect(exportCsv([{email:'a@example.com',first_name:'=IMPORTDATA("evil")'}])).toContain('"\'=IMPORTDATA(""evil"")"');});
});
describe('parseAirscalePerson',()=>{
 it('prefills city from LinkedIn location',()=>expect(parseAirscalePerson({location:{city:'Nantes',country:'France'}}).city).toBe('Nantes'));
 it('allows missing LinkedIn city without blocking prefill',()=>expect(parseAirscalePerson({location:{city:null}}).city).toBeNull());
 it('never overwrites a manually entered city during prefill',()=>expect(fillEmpty({city:'Rennes'},{city:'Nantes'}).city).toBe('Rennes'));
 it('reads job title and company from the current position group without a date',()=>{expect(parseAirscalePerson({firstname:'Camille',lastname:'Martin',industry:'Tech',positionGroups:{contents:[{company:{name:'Acme',url:'https://www.linkedin.com/company/acme'},profilePositions:[{title:'CTO'}]}]}})).toMatchObject({first_name:'Camille',last_name:'Martin',job_title:'CTO',company:'Acme',sector:'Tech'});});
 it('prefers the open-ended position over past ones',()=>{expect(parseAirscalePerson({positionGroups:{contents:[{date:{end:'2020-01'},company:{name:'OldCo',url:'https://www.linkedin.com/company/old'},profilePositions:[{title:'Junior',date:{end:'2020-01'}}]},{date:{end:null},company:{name:'NewCo',url:'https://www.linkedin.com/company/new'},profilePositions:[{title:'Lead',date:{end:null}}]}]}})).toMatchObject({job_title:'Lead',company:'NewCo'});});
 it('falls back to the first group when none is marked current',()=>{expect(parseAirscalePerson({positionGroups:{contents:[{date:{end:'2019-01'},company:{name:'Solo',url:'https://www.linkedin.com/company/solo'},profilePositions:[{title:'Dev',date:{end:'2019-01'}}]}]}})).toMatchObject({job_title:'Dev',company:'Solo'});});
 it('returns nulls when no position exists',()=>{expect(parseAirscalePerson({firstname:'A'})).toMatchObject({job_title:null,company:null});});
});
