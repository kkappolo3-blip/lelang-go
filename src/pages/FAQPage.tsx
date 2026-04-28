import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ChevronDown, HelpCircle, ShieldCheck, Zap, Coins, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  q: string;
  a: string;
  icon?: typeof Gavel;
}

const faqs: FAQItem[] = [
  {
    icon: Gavel,
    q: 'Bagaimana cara mengikuti lelang di Lelang-GO?',
    a: 'Daftar akun gratis, lakukan top-up Koin (1 Koin = Rp1.000) di menu Dompet, lalu pilih lelang aktif di halaman beranda. Klik "Bid Sekarang" dan masukkan jumlah penawaran kamu. Penawaran tertinggi saat lelang berakhir akan menang.',
  },
  {
    icon: Coins,
    q: 'Apa itu sistem Koin dan bagaimana cara top-up?',
    a: 'Koin adalah mata uang internal Lelang-GO. 1 Koin setara Rp1.000. Untuk top-up, buka menu Dompet → Top-Up, transfer ke rekening yang tertera, lalu unggah bukti transfer. Admin akan memverifikasi maksimal 1×24 jam, lalu Koin masuk otomatis ke saldo kamu.',
  },
  {
    icon: ShieldCheck,
    q: 'Apa itu Escrow Garansi 72 jam?',
    a: 'Setelah kamu memenangkan lelang, dana ditahan oleh sistem (escrow) selama 72 jam. Selama periode ini, kamu wajib mengecek lisensi/produk yang diterima. Jika ada masalah, ajukan komplain dan dana akan dikembalikan. Jika tidak ada komplain, dana otomatis diteruskan ke penjual setelah 72 jam.',
  },
  {
    icon: Zap,
    q: 'Apa itu sistem Anti-Sniper Bidding?',
    a: 'Anti-sniper mencegah praktik bidding di detik-detik terakhir. Jika ada penawaran masuk dalam 5 menit terakhir sebelum lelang berakhir, waktu lelang otomatis diperpanjang 2 menit. Ini memberi peserta lain kesempatan adil untuk membalas penawaran.',
  },
  {
    q: 'Bagaimana jika saya kalah dalam lelang?',
    a: 'Koin yang sebelumnya di-hold (ditahan) untuk penawaran kamu akan otomatis dikembalikan ke saldo Dompet segera setelah lelang berakhir. Tidak ada biaya untuk peserta yang kalah.',
  },
  {
    q: 'Apakah produk yang dilelang legal?',
    a: 'Ya. Semua software & lisensi yang dilelang di Lelang-GO sudah diverifikasi tim Gibikey Studio. Kami hanya menerima produk digital legal dengan lisensi yang dapat ditransfer.',
  },
  {
    q: 'Berapa biaya untuk mengikuti lelang?',
    a: 'Mendaftar dan ikut lelang gratis. Kamu hanya perlu menyediakan saldo Koin yang cukup untuk penawaran. Tidak ada biaya tersembunyi atau biaya keanggotaan.',
  },
  {
    q: 'Bagaimana cara klaim lisensi setelah menang?',
    a: 'Lisensi otomatis muncul di menu Transaksi setelah pembayaran berhasil. Kamu bisa download license key, file aktivasi, atau link akses langsung dari halaman tersebut.',
  },
  {
    q: 'Bisakah saya membatalkan penawaran?',
    a: 'Tidak. Demi menjaga integritas lelang, semua penawaran bersifat mengikat dan tidak dapat dibatalkan. Pastikan kamu yakin sebelum klik "Bid Sekarang".',
  },
  {
    q: 'Bagaimana cara menghubungi customer support?',
    a: 'Tim support kami tersedia melalui WhatsApp untuk respons cepat. Notifikasi penting (top-up disetujui, status lelang, kemenangan, dll) juga otomatis dikirim ke WhatsApp kamu.',
  },
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  // FAQPage Schema for Google Rich Results
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Breadcrumbs items={[{ label: 'FAQ' }]} />

      <main className="container space-y-10 py-8 pb-16">
        <header className="text-center max-w-2xl mx-auto">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary mb-4">
            <HelpCircle className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="mt-3 text-muted-foreground">
            Semua yang perlu kamu tahu tentang cara lelang, sistem escrow, anti-sniper bidding, dan
            keamanan transaksi di <span className="font-semibold text-foreground">Lelang-GO</span>.
          </p>
        </header>

        <section aria-label="Daftar pertanyaan" className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq, idx) => {
            const Icon = faq.icon;
            const isOpen = openIdx === idx;
            return (
              <article
                key={idx}
                className={cn(
                  'rounded-2xl border bg-card transition-all',
                  isOpen && 'shadow-md ring-1 ring-primary/20'
                )}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    {Icon && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                        <Icon className="h-4 w-4 text-accent-foreground" />
                      </div>
                    )}
                    <h2 className="font-display text-base font-semibold text-foreground">{faq.q}</h2>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <div className={cn('pl-12 text-sm leading-relaxed text-muted-foreground', !Icon && 'pl-0')}>
                      {faq.a}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <section
          aria-label="Masih ada pertanyaan"
          className="mx-auto max-w-2xl rounded-2xl gradient-hero p-8 text-center"
        >
          <h2 className="font-display text-xl font-bold text-primary-foreground">
            Masih ada pertanyaan?
          </h2>
          <p className="mt-2 text-sm text-primary-foreground/70">
            Tim Gibikey Studio siap membantu kamu kapan saja.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-foreground px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary-foreground/90 transition-colors"
          >
            <Gavel className="h-4 w-4" />
            Mulai Lelang Sekarang
          </Link>
        </section>
      </main>
    </>
  );
}
