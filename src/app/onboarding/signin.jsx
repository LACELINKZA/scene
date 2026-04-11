import { Redirect } from "expo-router";

// This file redirects to the actual signin page
export default function OnboardingSignIn() {
  return <Redirect href="/auth/signin" />;
}
