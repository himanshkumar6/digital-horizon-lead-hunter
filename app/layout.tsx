import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Digital Horizon — Lead Hunter',
  description: 'Internal B2B lead generation & CRM engine to discover local businesses, detect website & social opportunities, score leads, and generate personalized outreach pitches.',
  openGraph: {
    title: 'Digital Horizon — Lead Hunter',
    description: 'Internal B2B lead generation & CRM engine to discover local businesses, detect website & social opportunities, score leads, and generate personalized outreach pitches.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Horizon — Lead Hunter',
    description: 'Internal B2B lead generation & CRM engine to discover local businesses, detect website & social opportunities, score leads, and generate personalized outreach pitches.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased text-slate-900">
      <body suppressHydrationWarning className="min-h-full font-sans antialiased bg-[#f8fafc] text-slate-900">{children}</body>
    </html>
  );
}
