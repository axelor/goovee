const htmlMarkup = `import dynamic from "next/dynamic";
const Plyr = dynamic(() => import('plyr-react'), {ssr: false});

<Plyr
  options={{ loadSprite: true, clickToPlay: true }}
  source={{ type: 'video', sources: [{ src: '/media/movie.mp4', provider: 'html5' }] }}
/>
`;

const vimeoMarkup = `import dynamic from "next/dynamic";
const Plyr = dynamic(() => import('plyr-react'), {ssr: false});

<Plyr
  options={{ loadSprite: true, clickToPlay: true }}
  source={{ type: 'video', sources: [{ src: '15801179', provider: 'vimeo' }] }}
/>
`;

const youtubeMarkup = `import dynamic from "next/dynamic";
const Plyr = dynamic(() => import('plyr-react'), {ssr: false});

<Plyr
  options={{ loadSprite: true, clickToPlay: true }}
  source={{ type: 'video', sources: [{ src: 'j_Y2Gwaj7Gs', provider: 'youtube' }] }}
/>
`;

const embededMarkup = `<div className="ratio ratio-16x9">
  ANY EMBED CODE (IFRAME, EMBED, OBJECT from YOUTUBE, VIMEO ETC.)
</div>
`;

export {htmlMarkup, vimeoMarkup, youtubeMarkup, embededMarkup};
