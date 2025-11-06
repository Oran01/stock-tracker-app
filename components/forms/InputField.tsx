/**
 * File: components/forms/InputField.tsx
 * Purpose: Reusable text input field integrated with react-hook-form.
 * Exports: <InputField />
 *
 * Key ideas:
 * - Wraps shadcn/ui <Input> with a label, error message, and react-hook-form `register`.
 * - Supports full config: placeholder, type, disabled state, validation rules, and controlled value.
 * - Applies visual disabled styling based on props.
 *
 * @remarks
 * - `register` must come from `useForm()`.
 * - `validation` is forwarded directly into `register(name, validation)`.
 * - `value` enables controlled usage (optional).
 * - FieldError from react-hook-form is displayed when provided.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * InputField
 * @summary Controlled text input with label + validation + disabled styles,
 *          built for react-hook-form.
 *
 * @param props.name - Field name used by react-hook-form.
 * @param props.label - Visible label above the input.
 * @param props.placeholder - Placeholder text.
 * @param props.type - Input type (default `"text"`).
 * @param props.register - react-hook-form register function.
 * @param props.validation - Validation rules passed to `register`.
 * @param props.error - Optional FieldError for displaying validation messages.
 * @param props.disabled - Disable input and apply UI feedback.
 * @param props.value - Optional controlled value override.
 *
 * @example
 * <InputField
 *   name="email"
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   register={form.register}
 *   validation={{ required: "Email is required" }}
 *   error={form.formState.errors.email}
 * />
 */
const InputField = ({
  name,
  label,
  placeholder,
  type = "text",
  register,
  error,
  validation,
  disabled,
  value,
}: FormInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>
      <Input
        type={type}
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        className={cn("form-input", {
          "opacity-50 cursor-not-allowed": disabled,
        })}
        {...register(name, validation)}
      />
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
};

export default InputField;
