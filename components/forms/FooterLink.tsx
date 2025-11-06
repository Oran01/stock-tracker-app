/**
 * File: components/forms/FooterLink.tsx
 * Purpose: Small helper component used in auth forms for displaying
 *          “Don’t have an account? Sign up” or similar footer navigation text.
 * Exports: <FooterLink />
 *
 * Key ideas:
 * - Wraps a sentence with inline navigation using Next.js <Link>.
 * - Designed for authentication pages but can be reused anywhere.
 * - Keeps typography and spacing consistent across forms.
 */

import Link from "next/link";

/**
 * FooterLink
 * @summary Text block with an inline actionable link, typically placed
 *          under form cards (e.g., sign-in/sign-up toggles).
 *
 * @param props.text - Prefix sentence (e.g., "Don't have an account?").
 * @param props.linkText - The clickable link label (e.g., "Sign up").
 * @param props.href - The target route for the link.
 *
 * @example
 * <FooterLink
 *   text="Don't have an account?"
 *   linkText="Sign up"
 *   href="/sign-up"
 * />
 */
const FooterLink = ({ text, linkText, href }: FooterLinkProps) => {
  return (
    <div className="text-center pt-4">
      <p className="text-sm text-gray-500">
        {text}
        {` `}
        <Link href={href} className="footer-link">
          {linkText}
        </Link>
      </p>
    </div>
  );
};
export default FooterLink;
