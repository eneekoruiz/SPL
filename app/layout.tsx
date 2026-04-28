/**
 * app/layout.tsx
 * 
 * Layout raíz - Solo renderiza cuando se accede a / (sin tenant)
 * El middleware redirige a /app/[tenant]/ automáticamente
 */

export const metadata = {
  title: 'Ana Peluquera - SaaS',
  description: 'Multi-tenant SaaS platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
