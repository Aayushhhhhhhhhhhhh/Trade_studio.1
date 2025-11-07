'use client'
import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary'
}

export default function Button({ children, className = '', variant = 'default', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium'
  const variants = variant === 'secondary' ? 'bg-gray-100 text-gray-900' : 'bg-primary-600 text-white'

  return (
    <button {...props} className={`${base} ${variants} ${className}`}> 
      {children}
    </button>
  )
}
