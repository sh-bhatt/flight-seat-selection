import type { ReactNode, SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

function Icon({
  children,
  className = 'size-4',
  ...rest
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const PencilIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
);

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);

export const MinusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 12 5 5 9-10" />
  </Icon>
);

export const PlaneIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2l-1.3 1.3 6.3 3.4-3 3-2.7-.5L3 14.5l3.5 1.5 1.5 3.5 1.2-1.1-.5-2.7 3-3 3.4 6.3Z" />
  </Icon>
);

/** Brand mark: a circle with a swooping flight path. */
export const LogoIcon = (props: IconProps) => (
  <Icon strokeWidth={1.75} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M5.5 15.5c4.5-.5 9-3.5 13-8" />
    <path d="M14.5 7.5h4v4" />
  </Icon>
);
