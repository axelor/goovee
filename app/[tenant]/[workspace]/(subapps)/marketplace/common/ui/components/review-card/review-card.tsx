'use client';

import {Star} from 'lucide-react';
import {formatRelativeTime, formatDateTime} from '@/locale/formatters';
import {cn} from '@/utils/css';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Avatar,
  AvatarImage,
} from '@/ui/components';
import type {ListReview} from '../../../orm/orm';

interface ReviewCardProps {
  review: ListReview;
  tenantId: string;
}

export function ReviewCard({review, tenantId}: ReviewCardProps) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (initials: string) => {
    const colors = [
      'bg-yellow-100',
      'bg-blue-100',
      'bg-green-100',
      'bg-pink-100',
      'bg-purple-100',
      'bg-orange-100',
    ];
    return colors[initials.charCodeAt(0) % colors.length];
  };

  const initials = getInitials(review.author.simpleFullName);
  const avatarBgColor = getAvatarColor(initials);
  const hasImage = review.author.picture && review.author.picture.id;

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-3">
      <div className="flex items-start gap-3">
        {hasImage ? (
          <Avatar className="rounded-full h-10 w-10 flex-shrink-0">
            <AvatarImage
              src={`/api/tenant/${tenantId}/partner/image/${review.author.picture?.id}`}
              alt={review.author.simpleFullName || 'Reviewer'}
              size={40}
            />
          </Avatar>
        ) : (
          <div
            className={cn(
              'rounded-full h-10 w-10 flex items-center justify-center font-semibold text-sm flex-shrink-0',
              avatarBgColor,
            )}>
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-foreground text-sm">
              {review.author.simpleFullName}
            </p>
            {review.createdOn && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground cursor-help">
                      • {formatRelativeTime(review.createdOn)}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="text-xs">
                    {formatDateTime(review.createdOn, {
                      dateFormat: 'MMMM DD YYYY',
                      timeFormat: 'h:mm a',
                    })}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex gap-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                className={
                  i < review.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200'
                }
              />
            ))}
          </div>
        </div>
      </div>
      {review.reviewComment && (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {review.reviewComment}
        </p>
      )}
    </div>
  );
}
