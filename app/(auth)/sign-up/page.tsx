/**
 * File: app/(auth)/sign-up/page.tsx
 * Purpose: Client-side sign-up form that captures user profile + preferences and creates an account.
 * Exports: <SignUp/> (client component)
 *
 * Key ideas:
 * - Uses React Hook Form for controlled validation + UX (`mode: "onBlur"`).
 * - Collects auth fields (name, email, password) and personalization (country, goals, risk, industry).
 * - Submits to `signUpWithEmail` server action; on success, routes to the dashboard (`/`).
 * - Provides immediate feedback via `sonner` toasts.
 *
 * @remarks
 * - RHF integration:
 *   - Text inputs use <InputField/> (via `register` + `validation`).
 *   - Selects use <SelectField/> and <CountrySelectField/> (via `Controller`).
 * - Accessibility: labels are associated; error text appears under each field.
 * - UX: default values pre-populate sensible choices to reduce friction.
 * - Security: password field uses `type="password"`; no password is logged.
 *
 * @see lib/actions/auth.actions.ts#signUpWithEmail
 * @see components/forms/InputField.tsx
 * @see components/forms/SelectField.tsx
 * @see components/forms/CountrySelectField.tsx
 * @see https://react-hook-form.com/
 */

"use client";

import { Button } from "@/components/ui/button";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import { useForm } from "react-hook-form";
import FooterLink from "@/components/forms/FooterLink";
import { useRouter } from "next/navigation";
import { signUpWithEmail } from "@/lib/actions/auth.actions";
import { toast } from "sonner";

const SignUp = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      country: "US",
      investmentGoals: "Growth",
      riskTolerance: "Medium",
      preferredIndustry: "Technology",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const result = await signUpWithEmail(data);
      if (result.success) router.push("/");
    } catch (e) {
      console.error(e);
      toast.error("Sign up failed", {
        description:
          e instanceof Error ? e.message : "Failed to create an account.",
      });
    }
  };

  return (
    <>
      <h1 className="form-title">Sign Up & Personalize</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          name="fullName"
          label="Full Name"
          placeholder="John Doe"
          register={register}
          error={errors.fullName}
          validation={{ required: "Full name is required", minLength: 2 }}
        />
        <InputField
          name="email"
          label="Email"
          placeholder="contact@jsmastery.com"
          register={register}
          error={errors.email}
          validation={{
            required: "Email name is required",
            pattern: /^\w+@\w+\.\w+$/,
            message: "Email address is required",
          }}
        />
        <CountrySelectField
          name="country"
          label="Country"
          control={control}
          error={errors.country}
          required
        />
        <InputField
          name="password"
          label="Password"
          placeholder="Enter a strong password"
          type="password"
          register={register}
          error={errors.password}
          validation={{ required: "Password is required", minLength: 8 }}
        />

        <SelectField
          name="investmentGoals"
          label="Investment Goals"
          placeholder="Select your investment goal"
          options={INVESTMENT_GOALS}
          control={control}
          error={errors.investmentGoals}
          required
        />
        <SelectField
          name="riskTolerance"
          label="Risk Tolerance"
          placeholder="Select your risk level"
          options={RISK_TOLERANCE_OPTIONS}
          control={control}
          error={errors.riskTolerance}
          required
        />
        <SelectField
          name="preferredIndustry"
          label="Preferred Industry"
          placeholder="Select your preferred industry"
          options={PREFERRED_INDUSTRIES}
          control={control}
          error={errors.preferredIndustry}
          required
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full mt-5"
        >
          {isSubmitting ? "Creating account" : "Start Your Investing Journey"}
        </Button>

        <FooterLink
          text="Already have an account"
          linkText="Sign in"
          href="/sign-in"
        />
      </form>
    </>
  );
};

export default SignUp;
