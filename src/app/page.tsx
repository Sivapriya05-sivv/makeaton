import Link from "next/link";
import { Repeat, Receipt, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            Brightloop
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              asChild
              className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-5xl font-semibold tracking-tight text-slate-900">
            Subscription billing, done right.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Set up plans, run billing, collect payments, and prove every number
            reconciles — all in one place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Link href="/signup">Get started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-6 text-left md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Repeat className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                Recurring invoices
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Auto-generated from subscriptions. Never bill twice.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                Taxes and discounts
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Applied automatically from admin rules.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                Live reconciliation
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Every figure traceable. Every state audited.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500">
          © Brightloop 2025
        </div>
      </footer>
    </div>
  );
}

