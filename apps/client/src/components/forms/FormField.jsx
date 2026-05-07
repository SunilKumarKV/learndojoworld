/* eslint-disable react/prop-types */
import { forwardRef } from 'react';

const FormField = forwardRef(function FormField(
  { error, label, name, ...inputProps },
  ref
) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <input
        ref={ref}
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        {...inputProps}
      />
      {error ? (
        <span id={`${name}-error`} className="mt-2 block text-sm text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
});

export default FormField;
