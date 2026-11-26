
import './Input.css'

function Input({
  label,
  id,
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  required = false,
  error,
  autoComplete,
  ...props
}) {
  return (
    <div className="input-field">
      <label htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />

      {error && (
        <span
          id={`${id}-error`}
          className="input-error"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  )
}

export default Input
