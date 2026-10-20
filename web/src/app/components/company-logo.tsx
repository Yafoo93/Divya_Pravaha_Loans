import Image from "next/image";

export function CompanyLogo({
  size,
  className = "",
  priority = false,
  decorative = false,
}: {
  size: number;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      width={size}
      height={size}
      sizes={`${size}px`}
      priority={priority}
      alt={decorative ? "" : "Divya Pravaha company logo"}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
