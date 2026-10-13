export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-5 py-10"
      style={{
        backgroundImage:
          'radial-gradient(1200px 600px at 20% 10%, rgba(126,182,255,0.10), transparent 60%), radial-gradient(900px 500px at 80% 90%, rgba(111,220,140,0.06), transparent 60%)',
      }}
    >
      {children}
    </div>
  );
}
