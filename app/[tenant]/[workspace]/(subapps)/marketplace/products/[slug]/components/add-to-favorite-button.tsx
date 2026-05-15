'use client';

import {useState} from 'react';
import {Heart} from 'lucide-react';
import {Button} from '@/ui/components';
import {addProductToFavorites} from '../../../common/actions/actions';

interface AddToFavoriteButtonProps {
  productId: string;
  workspaceURI: string;
  isFavorite?: boolean;
}

export function AddToFavoriteButton({
  productId,
  workspaceURI,
  isFavorite: initialIsFavorite = false,
}: AddToFavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToFavorite = async () => {
    setIsLoading(true);
    try {
      const result = await addProductToFavorites({
        productId,
        workspaceURL: workspaceURI,
      });

      if (result.success) {
        setIsFavorite(!isFavorite);
      } else if (result.error) {
        console.error(result.message);
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
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
      {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    </Button>
  );
}
