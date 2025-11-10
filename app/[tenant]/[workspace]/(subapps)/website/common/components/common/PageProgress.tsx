'use client';
import {useEffect, useRef} from 'react';

function PageProgress() {
  const progressWrapRef = useRef<HTMLDivElement>(null);
  const progressPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (progressPathRef.current && progressWrapRef.current) {
      const offset = 50;
      const progressPath = progressPathRef.current;
      const progressWrap = progressWrapRef.current;

      const pathLength = progressPath.getTotalLength();

      progressPath.style.transition = progressPath.style.transition = 'none';
      progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
      progressPath.style.strokeDashoffset = pathLength.toString();

      progressPath.getBoundingClientRect();
      progressPath.style.transition = progressPath.style.transition =
        'stroke-dashoffset 10ms linear';
      window.addEventListener('scroll', function () {
        const scroll =
          document.body.scrollTop || document.documentElement.scrollTop;
        const height =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        const progress = pathLength - (scroll * pathLength) / height;
        progressPath.style.strokeDashoffset = progress.toString();
        const scrollElementPos =
          document.body.scrollTop || document.documentElement.scrollTop;
        // added classname
        if (scrollElementPos >= offset) {
          progressWrap.classList.add('active-progress');
        } else {
          progressWrap.classList.remove('active-progress');
        }
      });

      progressWrap.addEventListener('click', function (e) {
        e.preventDefault();
        window.scroll({top: 0, left: 0, behavior: 'smooth'});
      });
    }
  }, []);

  return (
    <div className="progress-wrap" ref={progressWrapRef}>
      <svg
        className="progress-circle svg-content"
        width="100%"
        height="100%"
        viewBox="-1 -1 102 102">
        <path
          d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"
          ref={progressPathRef}
        />
      </svg>
    </div>
  );
}

export default PageProgress;
