import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';

const locales = ['en', 'am'];

export default  async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {

  const something = (await params)
  const locale =  something.lang;
  console.log("this is lang: ", locale);

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
