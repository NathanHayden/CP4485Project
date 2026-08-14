import { redirect } from "next/navigation";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { getGoogleOauthUrl } from "@/googleOauthUtils";

export const metadata = {
  title: "Login · St. John's Travel Advisory",
  description: "Sign in with Google to manage events.",
};

export default function LoginPage() {
  async function login() {
    "use server";

    const redirectUrl = getGoogleOauthUrl();
    redirect(redirectUrl);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        Sign <span className="text-tricolour">In</span>
      </h1>
      <p className="mt-3 text-base text-fog">
        Log in with your Google account to add and manage events.
      </p>

      <Card className="mt-10 p-6">
        <form action={login}>
          <Button type="submit" fullWidth>
            Login with Google
          </Button>
        </form>
      </Card>
    </div>
  );
}