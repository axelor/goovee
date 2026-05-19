'use client';

import {useState} from 'react';
import {usePathname} from 'next/navigation';
import {Heart} from 'lucide-react';
import {Button} from '@/ui/components';
import {useToast} from '@/ui/hooks/use-toast';
import {addProductToFavorites} from '../../../actions/actions';
import {isRedirectError} from 'next/dist/client/components/redirect-error';
import {i18n} from '@/locale';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToFavorite = async () => {
    setIsLoading(true);
    try {
      const result = await addProductToFavorites({
        productId,
        workspaceURL,
        workspaceURI,
        returnUrl: pathname,
      });

      if (result.success) {
        setIsFavorite(!isFavorite);
      } else if (result.error) {
        toast({
          title: i18n.t('Error'),
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      if (!isRedirectError(error)) {
        toast({
          title: i18n.t('Error'),
          description: i18n.t('Failed to update favorite'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAddToFavorite}
      disabled={isLoading}
      variant="outline"
      size="lg"
      className="gap-2 rounded-full">
      <Heart
        size={18}
        className={isFavorite ? 'fill-red-500 text-red-500' : ''}
      />
      {isFavorite
        ? i18n.t('Remove from favorites')
        : i18n.t('Add to favorites')}
    </Button>
  );
}
