import {Link} from '@/ui/components/link';

const navbarCategories = [
  {label: 'All Events'},
  {label: 'Category 1'},
  {label: 'Category 2'},
  {label: 'Category 3'},
];

export const Navbar = () => {
  return (
    <nav
      className={`h-[3.375rem] w-full hidden lg:block dark:bg-primary dark:border-none dark:text-white bg-white text-main-black border-t border-grey-1  px-6 py-4 font-medium `}>
      <div
        className={`dark:divide-grey-2 divide-main-black flex items-center justify-center divide-x-2 space-x-5`}>
        {navbarCategories.map((category, index) => (
          <Link key={index} href="/" className="px-5">
            {category.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};
