import {FC} from 'react';

// ==========================================================
type TeamCard3Props = {
  name?: string;
  designation?: string;
  image?: string;
};
// ==========================================================
const TeamCard3: FC<TeamCard3Props> = ({name, image, designation}) => {
  return (
    <div className="position-relative">
      <div
        className="shape rounded bg-soft-primary rellax d-md-block"
        style={{
          zIndex: 0,
          width: '98%',
          height: '98%',
          right: '-0.75rem',
          bottom: '-0.75rem',
        }}
      />

      <div className="card shadow-lg">
        <figure className="card-img-top">
          <img className="img-fluid" src={image} alt="" />
        </figure>

        <div className="card-body px-6 py-5">
          <h4 className="mb-1">{name}</h4>
          <p className="mb-0">{designation}</p>
        </div>
      </div>
    </div>
  );
};

export default TeamCard3;
