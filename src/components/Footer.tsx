import TricolourBar from "@/components/TricolourBar";
import ThemeToggle from "@/components/ThemeToggle";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <TricolourBar />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="font-display text-lg font-extrabold tracking-tight">
              St. John&apos;s <span className="text-tricolour">Travel Advisory</span>
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="mt-4 flex flex-col items-center gap-2 border-t border-line pt-3 text-xs text-fog sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} St. John&apos;s Travel Advisory · Newfoundland &amp; Labrador</p>
          <p>Weather from Environment Canada &amp; Open-Meteo</p>
        </div>
      </div>
    </footer>
  );
}
