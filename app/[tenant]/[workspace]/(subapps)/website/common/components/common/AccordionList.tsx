import Accordion from '@/subapps/website/common/components/reuseable/accordion';
// -------- data -------- //
type AccordionItem = {
  id: string;
  expand?: boolean;
  heading?: string;
  body?: string;
};

type AccordionProps = {
  accordions: AccordionItem[];
  id: string;
};

function AccordionList(props: AccordionProps) {
  const {accordions, id} = props;
  return (
    <div className="accordion accordion-wrapper" id={id}>
      {accordions.map(item => (
        <Accordion
          type="plain"
          key={item.id}
          no={item.id}
          expand={item.expand}
          heading={item.heading}
          body={item.body}
          parentId={id}
        />
      ))}
    </div>
  );
}

export default AccordionList;
