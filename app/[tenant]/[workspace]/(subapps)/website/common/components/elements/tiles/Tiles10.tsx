function Tiles10(props: {image1?: string; image2?: string; image3?: string}) {
  const {image1, image2, image3} = props;
  return (
    <div className="row gx-md-5 gy-5 align-items-center">
      <div className="col-md-6">
        <div className="row gx-md-5 gy-5">
          <div className="col-md-10 offset-md-2">
            <figure className="rounded">
              <img src={image1} alt="" />
            </figure>
          </div>

          <div className="col-md-12">
            <figure className="rounded">
              <img src={image2} alt="" />
            </figure>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <figure className="rounded">
          <img src={image3} alt="" />
        </figure>
      </div>
    </div>
  );
}

export default Tiles10;
