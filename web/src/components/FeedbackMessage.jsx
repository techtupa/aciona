import './FeedbackMessage.css'

function FeedbackMessage({ variant = 'success', title, children }) {
    const isError = variant === 'error'

    return (
        <section
            className={`feedback-message feedback-message--${variant}`}
            role={isError ? 'alert' : 'status'}
            aria-atomic="true"
        >
            <h3>{title}</h3>
            <div className="feedback-message__content">
                {children}
            </div>
        </section>
    )
}

export default FeedbackMessage
