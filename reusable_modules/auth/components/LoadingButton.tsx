'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
};

export default function LoadingButton({
  isLoading = false,
  loadingText,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
      aria-busy={isLoading}
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : icon}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </button>
  );
}

