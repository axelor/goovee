import {ProgressBar} from '@/subapps/website/common/hooks/progress-bar';
// -------- data -------- //

function ProgressList(props: {
  items: {
    color?: string;
    id: string;
    percent?: number;
    title?: string;
  }[];
}) {
  const {items} = props;

  return (
    <ul className="progress-list mt-3">
      {/* used for the animated line */}
      <ProgressBar />
      {items.map(({color, id, percent, title}) => (
        <li key={id}>
          <p>{title}</p>
          <div className={`progressbar line ${color}`} data-value={percent} />
        </li>
      ))}
    </ul>
  );
}

export default ProgressList;
