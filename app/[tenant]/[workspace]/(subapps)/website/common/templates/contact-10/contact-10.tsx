import type {TemplateProps} from '@/subapps/website/common/types';
import {type Contact10Data} from './meta';
import SocialLinks from '@/subapps/website/common/components/reuseable/SocialLinks';

export function Contact10(props: TemplateProps<Contact10Data>) {
  const {data} = props;
  const {
    contact10Title: title,
    contact10Description: description,
    contact10Copyright: copyright,
    contact10InputLabel1: inputLabel1,
    contact10InputLabel2: inputLabel2,
    contact10InputLabel3: inputLabel3,
    contact10InvalidFeedback1: invalidFeedback1,
    contact10ValidFeedback2: validFeedback2,
    contact10InvalidFeedback2: invalidFeedback2,
    contact10ValidFeedback3: validFeedback3,
    contact10InvalidFeedback3: invalidFeedback3,
    contact10InputValue: inputValue,
    contact10Placeholder1: placeholder1,
    contact10Placeholder2: placeholder2,
    contact10Placeholder3: placeholder3,
    contact10SocialLinks,
  } = data || {};

  const socialLinks = contact10SocialLinks?.map(socialLink => ({
    id: socialLink.id,
    icon: `uil uil-${socialLink.attrs.icon || ''}`,
    url: socialLink.attrs.url || '#',
  }));
  return (
    <section className="wrapper bg-light">
      <div className="container py-14 py-md-16">
        <div className="card bg-soft-primary mb-8">
          <div className="card-body p-12">
            <div className="row align-items-center gx-md-8 gx-xl-12 gy-10">
              <div className="col-lg-6">
                <h2 className="display-4 mb-3 pe-lg-10">{title}</h2>
                <p className="lead pe-lg-12 mb-0">{description}</p>
              </div>

              <div className="col-lg-6">
                <form className="contact-form needs-validation">
                  <div className="messages"></div>
                  <div className="row gx-4">
                    <div className="col-md-6">
                      <div className="form-floating mb-4">
                        <input
                          required
                          type="text"
                          name="name"
                          id="frm_name"
                          placeholder={placeholder1}
                          className="form-control border-0"
                          data-error="First Name is required."
                        />

                        <label htmlFor="frm_name">{inputLabel1}</label>
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
                          id="frm_email"
                          className="form-control border-0"
                          placeholder={placeholder2}
                          data-error="Valid email is required."
                        />

                        <label htmlFor="frm_email">{inputLabel2}</label>
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
                          id="frm_message"
                          placeholder={placeholder3}
                          className="form-control border-0"
                          style={{height: 150}}
                        />

                        <label htmlFor="frm_message">{inputLabel3}</label>
                        <div className="valid-feedback">{validFeedback3}</div>
                        <div className="invalid-feedback">
                          {invalidFeedback3}
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <input
                        type="submit"
                        value={inputValue}
                        className="btn btn-outline-primary rounded-pill btn-send mb-3"
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="d-md-flex align-items-center justify-content-between">
          <p className="mb-2 mb-lg-0">{copyright}</p>
          <SocialLinks
            className="nav social social-muted mb-0 text-md-end"
            links={socialLinks || []}
          />
        </div>
      </div>
    </section>
  );
}
