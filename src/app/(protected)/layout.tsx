export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-heading font-semibold text-foreground">
            Dashboard
          </h1>
        </div>
      </header>
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
