import {Link} from '@tanstack/react-router';
import {LogIn} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useI18n} from '@/lib/i18n';
export function SignInInvite(){const {t}=useI18n();return <section className="flex min-h-[65dvh] flex-col items-center justify-center px-6 text-center"><LogIn className="mb-6 size-10 text-secondary"/><h1 className="text-4xl">{t('auth.title')}</h1><p className="mt-3 max-w-sm text-muted-foreground">{t('auth.required')}</p><Button asChild className="mt-6"><Link to="/login">{t('auth.login')}</Link></Button><p className="mt-6 max-w-sm text-sm text-muted-foreground">{t('auth.invitation')}</p></section>}