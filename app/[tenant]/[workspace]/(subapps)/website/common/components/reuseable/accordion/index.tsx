import {FC} from 'react';

// ==================================================
type AccordionProps = {
  no: string;
  body?: string;
  heading?: string;
  expand?: boolean;
  parentId: string;
  type?: 'plain' | 'shadow-lg';
};
// ==================================================

const Accordion: FC<AccordionProps> = props => {
  const {no, parentId, body, heading, expand, type = ''} = props;

  return (
    <div className={`card ${type} accordion-item`}>
      <div className="card-header" id={`heading${no}`}>
        <button
          data-bs-toggle="collapse"
          aria-controls={`collapse${no}`}
          data-bs-target={`#collapse${no}`}
          aria-expanded={expand ? 'true' : 'false'}
          className={expand ? 'accordion-button' : 'collapsed'}>
          {heading}
        </button>
      </div>

      <div
        id={`collapse${no}`}
        aria-labelledby={`heading${no}`}
        data-bs-parent={`#${parentId}`}
        className={`accordion-collapse collapse ${expand && 'show'}`}>
        <div className="card-body">
          <p className="fs-16">{body}</p>
        </div>
      </div>
    </div>
  );
};

export default Accordion;
