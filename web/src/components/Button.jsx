
import './Button.css'

function Button({
  children,
  type = 'button',
  variant = 'primary',
  onClick,
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      className={`button button--${variant}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
