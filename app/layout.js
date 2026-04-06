import './globals.css';

export const metadata = {
  title:       'SEMrush Dashboard',
  description: 'Dashboard de SEO em tempo real via API do SEMrush',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-surface text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
