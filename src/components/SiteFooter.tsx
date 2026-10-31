import {useSponsors} from '@/lib/data';
import {useI18n} from '@/lib/i18n';

export function SiteFooter(){
  const {data}=useSponsors();
  const {t}=useI18n();
  const sponsors=data?.sponsors.filter(s=>s.tier==='platinum'&&s.logo)??[];
  return (
    <footer className="border-t px-4 pt-8 pb-28 text-center lg:pb-10">
      {sponsors.length>0&&(
        <section aria-label={t('sponsors.support')}>
          <p className="mb-5 text-xs font-bold text-muted-foreground">{t('sponsors.support')}</p>
          <ul className="mx-auto grid w-full max-w-80 grid-cols-2 items-center justify-items-center gap-x-7 gap-y-5">
            {sponsors.map(s=>(
              <li key={s.id} className="flex h-14 w-full min-w-0 items-center justify-center">
                <a href={s.website??''} target="_blank" rel="noreferrer" className="flex h-full w-full items-center justify-center" aria-label={s.name}>
                  <img src={s.logo??''} alt={s.name} loading="lazy" className="max-h-full max-w-full object-contain"/>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className={sponsors.length>0?'mt-8':'mt-2'}>
        <a href="https://genai-days-nantes.com/" target="_blank" rel="noreferrer" className="text-xs font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground">{t('footer.eventSite')}</a>
      </p>
    </footer>
  );
}
