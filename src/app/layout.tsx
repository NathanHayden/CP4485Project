import type { Metadata } from "next";
import { Geist, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SplashScreen from "@/components/SplashScreen";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "St. John's Travel Advisory",
  description:
    "Your local travel advisory platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = (await cookies()).get("session");

  // Read the signed-in user's info out of the session JWT so the Navbar can
  // show their name and profile picture. If the token is missing or invalid,
  // there is no user and the Navbar shows a Login link instead.
  let user: { name?: string; email?: string; picture?: string } | null = null;
  if (session) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(session.value, secret);
      user = {
        name: payload.name as string | undefined,
        email: payload.email as string | undefined,
        picture: payload.picture as string | undefined,
      };
    } catch {
      user = null;
    }
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before anything is painted, so a visitor who chose dark mode
            last time does not get a flash of the light theme first. It also
            follows the setting on their computer when they have never picked
            one here. The same script hides the opening animation once it has
            already played this visit. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
  var saved = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (saved === "dark" || (saved === null && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
  if (sessionStorage.getItem("splashSeen")) {
    document.documentElement.classList.add("splash-seen");
  }
} catch (e) {}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        <Navbar user={user} />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
