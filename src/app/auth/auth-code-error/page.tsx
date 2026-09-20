import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading font-bold text-2xl">Sign-in didn&apos;t go through</h1>
      <p className="text-body max-w-sm">
        Something went wrong connecting to Google. Nothing was saved. Please try again.
      </p>
      <Link
        href="/"
        className="min-h-11 flex items-center justify-center px-5 rounded-2xl border border-ink font-semibold"
      >
        Back to welcome
      </Link>
    </div>
  );
}
