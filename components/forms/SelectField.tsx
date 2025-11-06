/**
 * File: components/forms/SelectField.tsx
 * Purpose: Reusable form-select component integrated with react-hook-form.
 * Exports: <SelectField />
 *
 * Key ideas:
 * - Wraps shadcn/ui <Select> with react-hook-form's <Controller>.
 * - Centralizes label, validation, placeholder, and options mapping.
 * - Supports required validation via react-hook-form rules.
 *
 * @remarks
 * - `error` is expected to be a react-hook-form FieldError.
 * - `control` must come from `useForm()`.
 * - Options follow `{ value: string; label: string }` shape.
 */

import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * SelectField
 * @summary Controlled select input built for react-hook-form, with label +
 *          validation message + option rendering.
 *
 * @param props.name - Field name used by react-hook-form.
 * @param props.label - Visible field label above the select trigger.
 * @param props.placeholder - Text shown before a selection is made.
 * @param props.options - Array of `{ label, value }` options.
 * @param props.control - react-hook-form control instance.
 * @param props.error - Optional validation error.
 * @param props.required - Add a required rule + error message.
 *
 * @example
 * <SelectField
 *   name="riskTolerance"
 *   label="Risk tolerance"
 *   placeholder="Select..."
 *   control={form.control}
 *   required
 *   options={[
 *     { value: "low", label: "Low" },
 *     { value: "medium", label: "Medium" },
 *     { value: "high", label: "High" },
 *   ]}
 * />
 */
const SelectField = ({
  name,
  label,
  placeholder,
  options,
  control,
  error,
  required = false,
}: SelectFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>

      <Controller
        name={name}
        control={control}
        rules={{
          required: required ? `Please select ${label.toLowerCase()}` : false,
        }}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="select-trigger">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 text-white">
              {options.map((option) => (
                <SelectItem
                  value={option.value}
                  key={option.value}
                  className="focus:bg-gray-600 focus:text-white"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
            {error && <p className="text-sm text-red-500">{error.message}</p>}
          </Select>
        )}
      />
    </div>
  );
};

export default SelectField;
