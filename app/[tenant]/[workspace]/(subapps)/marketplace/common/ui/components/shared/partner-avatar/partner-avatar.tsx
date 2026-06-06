import {Avatar, AvatarImage} from '@/ui/components/avatar';
import {cn} from '@/utils/css';

type PartnerAvatarProps = {
  partner: {
    simpleFullName: string | null;
    picture: {id: string} | null;
  };
  tenantId: string;
  /** Diameter in pixels. Defaults to 40. */
  size?: number;
  /** Optional tailwind background class for the fallback initial. */
  fallbackClassName?: string;
};

export function PartnerAvatar({
  partner,
  tenantId,
  size = 40,
  fallbackClassName = 'bg-muted',
}: PartnerAvatarProps) {
  const pictureId = partner.picture?.id;
  const initial = (partner.simpleFullName?.[0] ?? '?').toUpperCase();
  const style = {width: size, height: size};

  if (pictureId) {
    return (
      <Avatar className="rounded-full shrink-0" style={style}>
        <AvatarImage
          src={`/api/tenant/${tenantId}/partner/image/${pictureId}`}
          alt={partner.simpleFullName || 'Reviewer'}
          size={size}
        />
      </Avatar>
    );
  }
  return (
    <div
      style={style}
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-sm shrink-0',
        fallbackClassName,
      )}>
      {initial}
    </div>
  );
}
