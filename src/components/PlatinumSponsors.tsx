import {useSponsors} from '@/lib/data';
import {useI18n} from '@/lib/i18n';
export function PlatinumSponsors(){
 const {data}=useSponsors();const {t}=useI18n();const sponsors=data?.sponsors.filter(s=>s.tier==='platinum'&&s.logo)??[];
 if(!sponsors.length)return null;
 return <section className="mt-10 w-full border-t pt-6" aria-label={t('sponsors.support')}><p className="mb-5 text-center text-xs font-bold text-muted-foreground">{t('sponsors.support')}</p><ul className="mx-auto grid w-full max-w-80 grid-cols-2 items-center justify-items-center gap-x-7 gap-y-5">{sponsors.map(s=><li key={s.id} className="flex h-14 w-full min-w-0 items-center justify-center"><img src={s.logo??''} alt={s.name} className="max-h-full max-w-full object-contain"/></li>)}</ul></section>;
}