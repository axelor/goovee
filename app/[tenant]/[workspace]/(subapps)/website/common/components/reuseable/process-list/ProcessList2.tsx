import {FC} from 'react';

// ==============================================================
type ProcessList2Props = {
  no?: string;
  title?: string;
  subtitle?: string;
  className?: string;
};
// ==============================================================

const ProcessList2: FC<ProcessList2Props> = props => {
  const {no, title, subtitle, className} = props;

  return (
    <div className="d-flex flex-row mb-6">
      <div>
        <span className={className}>
          <span className="number fs-18">{no}</span>
        </span>
      </div>

      <div>
        <h4 className="mb-1">{title}</h4>
        <p className="fs-16 mb-0">{subtitle}</p>
      </div>
    </div>
  );
};

export default ProcessList2;
