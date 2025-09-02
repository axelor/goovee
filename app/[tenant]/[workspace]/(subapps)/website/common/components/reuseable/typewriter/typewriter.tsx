'use client';
import {ComponentProps} from 'react';
import TypewriterEffect from 'typewriter-effect';

export function Typewriter(props: ComponentProps<typeof TypewriterEffect>) {
  return <TypewriterEffect {...props} />;
}
