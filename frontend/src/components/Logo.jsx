export default function Logo({ className = 'size-10' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="KYU Mart logo">
      <rect width="32" height="32" rx="8" fill="#15803d" />
      <path d="M16 4 26.5 8.5 16 13 5.5 8.5Z" fill="#bbf7d0" />
      <path d="M24 10v4" stroke="#bbf7d0" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 16h14l1.6 11H7.4Z" fill="#fff" />
      <path d="M14.2 19.5v5.5M14.2 22.2l3.8-2.7M15.6 21.4l3.2 3.6" stroke="#15803d" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
