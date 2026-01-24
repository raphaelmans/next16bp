import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";

export type FormLayout = "vertical" | "horizontal" | "inline";

export interface StandardFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  layout?: FormLayout;
}

export type FieldSize = "sm" | "default" | "lg";
export type FieldVariant = "default" | "ghost" | "outlined";

export interface StandardInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends StandardFieldProps<TFieldValues, TName> {
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "datetime-local";
  autoComplete?: string;
  size?: FieldSize;
  variant?: FieldVariant;
}

export interface StandardSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends StandardFieldProps<TFieldValues, TName> {
  options: Array<{ label: string; value: string }>;
  emptyOptionLabel?: string;
  size?: FieldSize;
}

export interface StandardFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<StandardFieldProps<TFieldValues, TName>, "placeholder"> {
  children:
    | React.ReactNode
    | ((props: {
        field: ControllerRenderProps<TFieldValues, TName>;
        disabled?: boolean;
      }) => React.ReactNode);
}
