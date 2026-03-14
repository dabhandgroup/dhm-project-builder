export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-zinc-950 text-white p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-950 text-sm font-bold">
            DH
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            Dab Hand Marketing
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            Build websites faster.<br />
            Manage projects smarter.
          </h1>
          <p className="text-zinc-400 text-[15px] leading-relaxed max-w-sm">
            The internal platform that powers every build — from brief to
            launch, all in one place.
          </p>
        </div>

        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Dab Hand Marketing Ltd
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
