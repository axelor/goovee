'use client';

import {useMemo} from 'react';
import {MdFolderOpen} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/ui/components/accordion';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {useSearchParams} from '@/subapps/resources/common/ui/hooks/use-search-params';
import styles from './category-explorer.module.scss';
import {DynamicIcon} from '@/ui/components/dynamic-icon';

interface CategoryExplorerProps extends React.HTMLAttributes<HTMLDivElement> {
  categories?: any[];
  activeCategory?: string;
}

export function CategoryExplorer({categories = []}: CategoryExplorerProps) {
  const {searchParams, updateSearchParams} = useSearchParams();
  const current = searchParams.get('id');

  const defaultValue = useMemo(() => {
    if (current) {
      const category = categories.find(c => c.id === current);
      return [...(category?._parent || []), current];
    }
  }, [categories, current]);

  const renderCategory = (category: any) => {
    const {
      id,
      fileName: label,
      children,
      logoSelect: icon,
      colorSelect: color,
    } = category;

    const active = id === current;

    const leaf = !children?.length;

    const handleClick = () => {
      updateSearchParams([
        {
          key: 'id',
          value: category.id,
        },
      ]);
    };

    return (
      <AccordionItem
        value={String(id)}
        className={cn('border-b-0 space-y-2 m-0', styles['accordion-item'])}
        key={id}>
        <AccordionTrigger
          className={cn('hover:no-underline py-0.5 px-2 rounded-lg', {
            'bg-success-light text-success': active,
          })}
          icon={!leaf}
          onClick={handleClick}>
          <div className="flex grow gap-2 items-center cursor-pointer">
            {icon ? (
              <DynamicIcon
                className="h-4 w-4 text-muted-foreground shrink-0"
                fill={color}
                icon={icon}
              />
            ) : (
              <MdFolderOpen
                className="h-4 w-4 text-muted-foreground shrink-0"
                fill={color}
              />
            )}
            <p className="leading-4 text-xs line-clamp-1 text-start">{label}</p>
          </div>
        </AccordionTrigger>
        {!leaf && (
          <AccordionContent className="py-0 pt-4">
            <div className="ps-6 space-y-4">{children.map(renderCategory)}</div>
          </AccordionContent>
        )}
      </AccordionItem>
    );
  };

  return (
    <Accordion
      type="multiple"
      className="w-full space-y-4"
      defaultValue={defaultValue}>
      {categories.filter(c => !c.parent).map(renderCategory)}
    </Accordion>
  );
}

export default CategoryExplorer;
