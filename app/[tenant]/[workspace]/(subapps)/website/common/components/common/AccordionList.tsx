import Accordion from '@/subapps/website/common/components/reuseable/accordion';
// -------- data -------- //
const accordions = [
  {
    no: 'One',
    expand: true,
    heading: 'Quality of Service',
    body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
  },
  {
    no: 'Two',
    expand: false,
    heading: 'Competitive Pricing',
    body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
  },
  {
    no: 'Three',
    expand: false,
    heading: 'Customer Service',
    body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
  },
];

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
