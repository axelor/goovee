'use client';
import dynamic from 'next/dynamic';

const Plyr = dynamic(() => import('plyr-react'), {ssr: false});

export default Plyr;
