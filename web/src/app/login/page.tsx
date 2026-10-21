import type { Metadata } from "next";
import { LoginForm } from "../components/login-form";
import { CompanyLogo } from "../components/company-logo";
import { prototypeLoginAccounts } from "@/lib/workspace-context";

export const metadata: Metadata = { title: "Staff sign in · Divya Pravaha" };

export default function LoginPage() {
  return (
    <main className="grid min-h-[calc(100vh-33px)] lg:grid-cols-[minmax(22rem,0.8fr)_minmax(32rem,1.6fr)]">
      <section className="bg-primary hidden flex-col justify-between p-10 text-white lg:flex">
        <div>
          <CompanyLogo
            size={64}
            priority
            className="rounded-2xl bg-white p-1"
          />
          <p className="mt-10 text-sm font-bold tracking-wider text-blue-100 uppercase">
            Staff operations portal
          </p>
          <h1 className="mt-4 max-w-md text-4xl leading-tight font-bold">
            Divya Pravaha Trading and Financial Services
          </h1>
          <p className="mt-5 text-blue-100">
            Clarity in every loan.
            <br />
            Accountability in every cedi.
          </p>
        </div>
        <div className="rounded-2xl border border-white/25 bg-white/10 p-5">
          <p className="text-xs font-bold uppercase">Controlled workspace</p>
          <ul className="mt-4 space-y-3 text-sm text-blue-50">
            <li>Borrower and group records</li>
            <li>Loan approval and cash operations</li>
            <li>Independent reconciliation</li>
            <li>Traceable, append-only history</li>
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-lg">
          <span className="bg-primary/10 text-primary inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase">
            Demo workspace
          </span>
          <h2 className="mt-6 text-4xl font-bold">Welcome back.</h2>
          <p className="text-muted mt-2">
            Sign in to your staff workspace using your individual account.
          </p>
          <div className="border-border bg-surface mt-8 rounded-2xl border p-6 shadow-sm sm:p-8">
            <h3 className="text-xl font-bold">Staff sign-in</h3>
            <p className="text-muted mt-1 text-sm">
              Enter your email address and password.
            </p>
            <div className="mt-6">
              <LoginForm accounts={prototypeLoginAccounts} />
            </div>
          </div>
          <p className="text-muted mt-5 text-xs">
            Private staff access only · No live financial transactions
          </p>
        </div>
      </section>
    </main>
  );
}
