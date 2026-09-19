export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col gap-6 px-4 py-6"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 1.5rem)" }}
    >
      {children}
    </main>
  );
}
