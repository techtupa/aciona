
import './Textarea.css'

function Textarea({
  label,
  id,
  name,
  placeholder,
  value,
  onChange,
  required = false,
  rows = 4,
  error,
}) {
  return (
    <div className="textarea-field">
      <label htmlFor={id}>
        {label}
      </label>

      <textarea
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />

      {error && (
        <span id={`${id}-error`} className="textarea-error">
          {error}
        </span>
      )}
    </div>
  )
}

export default Textarea
