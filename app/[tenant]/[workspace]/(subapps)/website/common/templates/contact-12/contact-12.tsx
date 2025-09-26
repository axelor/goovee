import type {TemplateProps} from '@/subapps/website/common/types';
import {type Contact12Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

export function Contact12(props: TemplateProps<Contact12Data>) {
  const {data} = props;
  const {
    contact12Title: title,
    contact12Description: description,
    contact12Image,
    contact12InputLabel1: inputLabel1,
    contact12InputLabel2: inputLabel2,
    contact12InputLabel3: inputLabel3,
    contact12InvalidFeedback1: invalidFeedback1,
    contact12ValidFeedback1: validFeedback1,
    contact12ValidFeedback2: validFeedback2,
    contact12InvalidFeedback2: invalidFeedback2,
    contact12ValidFeedback3: validFeedback3,
    contact12InvalidFeedback3: invalidFeedback3,
    contact12InputValue: inputValue,
    contact12Placeholder1: placeholder1,
    contact12Placeholder2: placeholder2,
    contact12Placeholder3: placeholder3,
    contact12WrapperClassName: wrapperClassName,
    contact12ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: contact12Image,
    path: 'contact12Image',
    ...props,
  });

  return (
    <section
      className={wrapperClassName}
      style={{backgroundImage: `url(${image})`}}
      data-code={props.code}>
      <div className={containerClassName}>
        <div className="row">
          <div className="col-xl-9 mx-auto">
            <div className="card border-0 bg-white-900">
              <div className="card-body py-lg-13 px-lg-16">
                <h2 className="display-5 mb-3 text-center">{title}</h2>
                <p className="lead fs-lg text-center mb-10">{description}</p>
                <form
                  className="contact-form needs-validation"
                  method="post"
                  noValidate>
                  <div className="messages"></div>
                  <div className="row gx-4">
                    <div className="col-md-6">
                      <div className="form-floating mb-4">
                        <input
                          required
                          type="text"
                          name="name"
                          id="form_name"
                          placeholder={placeholder1}
                          className="form-control bg-white-700 border-0"
                        />
                        <label htmlFor="form_name">{inputLabel1}</label>
                        <div className="valid-feedback">{validFeedback1}</div>
                        <div className="invalid-feedback">
                          {invalidFeedback1}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-floating mb-4">
                        <input
                          required
                          type="email"
                          name="email"
                          id="form_email"
                          placeholder={placeholder2}
                          className="form-control bg-white-700 border-0"
                        />
                        <label htmlFor="form_email">{inputLabel2}</label>
                        <div className="valid-feedback">{validFeedback2}</div>
                        <div className="invalid-feedback">
                          {invalidFeedback2}
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-floating mb-4">
                        <textarea
                          required
                          name="message"
                          id="form_message"
                          placeholder={placeholder3}
                          className="form-control bg-white-700 border-0"
                          style={{height: 150}}
                        />
                        <label htmlFor="form_message">{inputLabel3}</label>
                        <div className="valid-feedback">{validFeedback3}</div>
                        <div className="invalid-feedback">
                          {invalidFeedback3}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 text-center">
                      <input
                        type="submit"
                        className="btn btn-primary rounded-pill btn-send"
                        value={inputValue}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
