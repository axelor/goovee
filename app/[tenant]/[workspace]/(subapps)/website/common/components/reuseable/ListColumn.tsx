import {FC} from 'react';

// ===========================================================
type ListColumnProps = {
  list?: {id: string; attrs: {title?: string}}[];
  rowClass?: string;
  bulletColor?: string;
};
// ===========================================================

const ListColumn: FC<ListColumnProps> = ({
  list,
  rowClass = '',
  bulletColor,
}) => {
  bulletColor = bulletColor || 'soft-primary';
  const fields = (list || []).map(v => v?.attrs?.title).filter(Boolean);
  const items = [];

  for (let i = 0; i < fields.length; i += 2) {
    const item = [];

    fields[i] && item.push(fields[i]);
    fields[i + 1] && item.push(fields[i + 1]);

    items.push(item);
  }
  return (
    <div className={'row gy-3 ' + rowClass}>
      {items.map((item, i) => (
        <div className="col-xl-6" key={i}>
          <ul className={`icon-list bullet-bg bullet-${bulletColor} mb-0`}>
            {item.map((li, i) => {
              const liProps = i !== 0 ? {className: 'mt-3'} : {};
              return (
                <li key={i} {...liProps}>
                  <i className="uil uil-check" /> {li}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ListColumn;
