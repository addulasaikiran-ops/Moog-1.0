import Logo from "@/components/Logo";
import { ArrowUpRight } from "lucide-react";
export default function NotFound() {
  return (
    <main className="legalPage moogErrorPage">
      <section className="legalShell" aria-labelledby="not-found-title">
        <Logo className="minimalLogo" />
        <p className="eyebrow">404 · NOT FOUND</p>
        <h1 id="not-found-title">This share is no longer available.</h1>
        <p>The link may have expired, been revoked, or never existed. Moog controls access, not copies.</p>
        <a className="primary legalButton" href="/">Return to Moog <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></a>
      </section>
    </main>
  );
}
