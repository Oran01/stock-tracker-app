/**
 * File: app/(auth)/sign-in/page.tsx
 * Purpose: Client-side sign-in form that authenticates an existing user via email/password.
 * Exports: <SignIn/> (client component)
 *
 * Key ideas:
 * - Uses React Hook Form (`mode: "onBlur"`) for validation + form state control.
 * - Submits credentials to the `signInWithEmail` server action.
 * - On success, user is redirected to the main dashboard (`/`).
 * - Error handling is surfaced using `sonner` toast notifications.
 *
 * @remarks
 * - Security: password field uses `type="password"` and is never logged.
 * - UX: `isSubmitting` disables the button and shows an inline loading state.
 * - Validation:
 *   - Email uses regex for basic format checking.
 *   - Password requires a minimum length of 8 characters.
 * - Navigation: redirect performed using `next/navigation` router.
 *
 * @see lib/actions/auth.actions.ts#signInWithEmail
 * @see components/forms/InputField.tsx
 * @see components/forms/FooterLink.tsx
 * @see https://react-hook-form.com/
 */

"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";
import { signInWithEmail } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SignIn = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      const result = await signInWithEmail(data);
      if (result.success) router.push("/");
    } catch (e) {
      console.error(e);
      toast.error("Sign in failed", {
        description: e instanceof Error ? e.message : "Failed to sign in.",
      });
    }
  };

  return (
    <>
      <h1 className="form-title">Welcome back</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          name="email"
          label="Email"
          placeholder="contact@jsmastery.com"
          register={register}
          error={errors.email}
          validation={{
            required: "Email is required",
            pattern: /^\w+@\w+\.\w+$/,
          }}
        />

        <InputField
          name="password"
          label="Password"
          placeholder="Enter your password"
          type="password"
          register={register}
          error={errors.password}
          validation={{ required: "Password is required", minLength: 8 }}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full mt-5"
        >
          {isSubmitting ? "Signing In" : "Sign In"}
        </Button>

        <FooterLink
          text="Don't have an account?"
          linkText="Create an account"
          href="/sign-up"
        />
      </form>
    </>
  );
};
export default SignIn;
