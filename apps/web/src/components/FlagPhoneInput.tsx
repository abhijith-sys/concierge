import PhoneInput from "react-phone-number-input";
import { twMerge } from "tailwind-merge";
import "react-phone-number-input/style.css";

export function FlagPhoneInput({
  value,
  onChange,
  error,
  disabled,
  id,
}: {
  value?: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry="IN"
      countryCallingCodeEditable={false}
      value={value || undefined}
      onChange={(next) => onChange(next ?? "")}
      disabled={disabled}
      className={twMerge("flag-phone", error && "flag-phone-error")}
      numberInputProps={{
        className: "flag-phone-number",
        autoComplete: "tel",
      }}
    />
  );
}
