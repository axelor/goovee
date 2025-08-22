function Tiles5(props: {images: string[]}) {
  const {images} = props;

  return (
    <>
      <div
        className="shape bg-dot primary rellax w-16 h-20"
        style={{top: '3rem', left: '5.5rem'}}
      />

      <div className="overlap-grid overlap-grid-2">
        {images.map((item, i) => (
          <div className="item" key={item + i}>
            <figure className="rounded shadow">
              <img src={item} alt="image" />
            </figure>
          </div>
        ))}
      </div>
    </>
  );
}

export default Tiles5;
