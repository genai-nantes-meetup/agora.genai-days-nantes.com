import {useQuery} from '@tanstack/react-query';
import {QrCode} from 'lucide-react';
import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {useAuth} from '@/lib/auth';
import {useI18n} from '@/lib/i18n';
import {myProfileOptions} from '@/lib/member-queries';
import {buildVCard} from '@/lib/vcard';

export function MyQrCode() {
  const {t} = useI18n();
  const {user} = useAuth();
  const [open, setOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const {data: profile} = useQuery({...myProfileOptions(user?.id ?? ''), enabled: !!user});

  useEffect(() => {
    if (!open || !profile) return;
    let cancelled = false;
    void import('qrcode').then((qr) =>
      qr.toDataURL(buildVCard(profile), {margin: 1, width: 512, color: {dark: '#393636', light: '#FFFFFF'}}),
    ).then((url) => {
      if (!cancelled) setQrUrl(url);
    }).catch(() => {
      if (!cancelled) setQrUrl(null);
    });
    return () => {
      cancelled = true;
    };
  }, [open, profile]);

  if (!user) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('qr.button')}
        title={t('qr.button')}
        onClick={() => setOpen(true)}
      >
        <QrCode className="size-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('qr.title')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {qrUrl ? (
              <img src={qrUrl} alt={t('qr.title')} className="size-64 border-2 border-foreground" width={256} height={256} />
            ) : (
              <div className="size-64 animate-pulse border-2 border-foreground/20 bg-surface" aria-hidden="true" />
            )}
            <p className="text-center text-sm text-foreground/70">{t('qr.hint')}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
