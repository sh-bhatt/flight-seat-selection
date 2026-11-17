import { getPassengerInitial } from '@/lib/passengerInitial';

type AvatarSize = 'md' | 'sm';

interface PassengerAvatarProps {
  name: string;
  /** The passenger the next seat click is for: navy instead of the soft blue. */
  isActive: boolean;
  size?: AvatarSize;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  md: 'size-9 text-[13px]',
  sm: 'size-7 text-[11px]',
};

/** Round badge with the passenger's initials; decorative (the name sits beside it). */
export function PassengerAvatar({
  name,
  isActive,
  size = 'md',
}: PassengerAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${SIZE_CLASSES[size]} ${
        isActive ? 'bg-navy text-white' : 'bg-seat-group text-foreground'
      }`}
    >
      {getPassengerInitial(name)}
    </span>
  );
}
