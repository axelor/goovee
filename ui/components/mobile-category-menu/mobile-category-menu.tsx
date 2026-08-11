'use client';
import {useState} from 'react';

// ---- CORE IMPORTS ---- //
import type {Category} from '@/types';
import {MdChevronLeft, MdChevronRight} from 'react-icons/md';

export const MobileCategoryMenu = ({
  category,
  parent,
  handleBack = () => {},
  onItemClick,
  slugKey,
  url,
  header,
  footer,
}: {
  category: Category[];
  parent: Category | null;
  handleBack?: () => void;
  onItemClick: any;
  slugKey?: string | null;
  url?: string | null;
  /* Extra controls shown around the list. Each level covers the one before
     it, and the deeper levels are rendered without them, so these only ever
     appear on the top-level menu. */
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) => {
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [activeParent, setActiveParent] = useState<Category | null>(null);

  const handleClick = (category: any) => {
    setActiveParent(category);
    setActiveCategories(category.items);
  };

  const handleGoBack = () => {
    setActiveCategories([]);
    setActiveParent(null);
  };

  return (
    <>
      <div className="w-full h-screen overflow-y-auto absolute left-0 top-0  bg-background border-none">
        <div className="flex flex-col mt-10">
          {parent && (
            <div
              onClick={handleBack}
              className="flex flex-row cursor-pointer border-b px-6 py-6">
              <div>
                <MdChevronLeft width={32} height={32} />
              </div>
              <p className="leading-4 line-clamp-1 ml-4 font-semibold text-start">
                {parent.name}
              </p>
            </div>
          )}
          {header}
          {category?.map(item => {
            const urlPath = slugKey
              ? url
                ? `${url}/${item[slugKey as keyof typeof item]}`
                : item[slugKey as keyof typeof item]
              : null;
            return (
              <div
                key={item.id}
                className="w-full flex justify-between py-6 px-4 md:px-6 border-b ">
                <div
                  onClick={() =>
                    onItemClick({
                      category: item,
                      url: urlPath,
                    })
                  }
                  className="cursor-pointer">
                  <p className="leading-4 line-clamp-1 text-start">
                    {item.name}
                  </p>
                </div>
                {item?.items && item.items.length > 0 && (
                  <div
                    onClick={() => handleClick(item)}
                    className="cursor-pointer">
                    <MdChevronRight />
                  </div>
                )}
              </div>
            );
          })}
          {footer}
        </div>
      </div>

      {activeParent && activeCategories.length > 0 && (
        <MobileCategoryMenu
          category={activeCategories}
          parent={activeParent}
          handleBack={handleGoBack}
          onItemClick={onItemClick}
          slugKey={slugKey}
          url={
            slugKey
              ? url
                ? `${url}/${activeParent[slugKey as keyof typeof activeParent]}`
                : `${activeParent[slugKey as keyof typeof activeParent]}`
              : null
          }
        />
      )}
    </>
  );
};
