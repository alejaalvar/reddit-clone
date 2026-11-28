/**
 * @file Creates and exports AuthCard, the card that frames the log in and sign up forms
 * @module client/src/components/AuthCard.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

/**
 * A centered daisyUI card: the page's heading, the form (children), and
 * a footer line under it such as "New here? Sign up".
 */
export default function AuthCard({ title, children, footer }) {
  return (
    <div className="card mx-auto mt-8 w-full max-w-sm bg-base-100 shadow-md">
      <div className="card-body gap-4">
        <h1 className="card-title text-2xl">{title}</h1>
        {children}
        {footer && <p className="text-center text-sm">{footer}</p>}
      </div>
    </div>
  );
}
