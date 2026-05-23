'use client';

import {i18n} from '@/locale';
import {Button} from '@/ui/components';
import {useToast} from '@/ui/hooks/use-toast';
import {cn} from '@/utils/css';
import {Heart} from 'lucide-react';
import {isRedirectError} from 'next/dist/client/components/redirect-error';
import {usePathname} from 'next/navigation';
import {useState, useTransition} from 'react';
import {addProductToFavorites} from '../../../actions/actions';

interface AddToFavoriteButtonProps {
  productId: string;
  workspaceURL: string;
  workspaceURI: string;
  isFavorite?: boolean;
}

export function AddToFavoriteButton({
  productId,
  workspaceURL,
  workspaceURI,
  isFavorite: initialIsFavorite = false,
}: AddToFavoriteButtonProps) {
  const pathname = usePathname();
  const {toast} = useToast();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const next = !isFavorite;
    setIsFavorite(next); // optimistic
    startTransition(async () => {
      try {
        const result = await addProductToFavorites({
          productId,
          workspaceURL,
          workspaceURI,
          returnUrl: pathname,
          isFavorite: next,
        });
        if (result.error) {
          setIsFavorite(!next); // revert
          toast({
            title: i18n.t('Error'),
            description: result.message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        if (!isRedirectError(error)) {
          setIsFavorite(!next); // revert
          toast({
            title: i18n.t('Error'),
            description: i18n.t('Failed to update favorite'),
            variant: 'destructive',
          });
        }
      }
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant="outline"
      size="lg"
      className="gap-2 rounded-full">
      <Heart
        size={18}
        className={cn('shrink-0', {
          'fill-red-500 text-red-500': isFavorite,
        })}
      />
      {isFavorite
        ? i18n.t('Remove from favorites')
        : i18n.t('Add to favorites')}
    </Button>
  );
}
