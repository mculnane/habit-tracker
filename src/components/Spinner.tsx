interface Props {
  size?: number
}

export function Spinner({ size = 40 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeOpacity="0.12" strokeWidth="6" />
      <path
        d="M26 50 L44 66 L78 30"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="120"
        strokeDashoffset="120"
        className="animate-spinner-trace"
      />
    </svg>
  )
}
