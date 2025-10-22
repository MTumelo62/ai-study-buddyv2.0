
import React from 'react';

export const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`animate-spin ${props.className || ''}`} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3m-12 0H3m16.03-6.03L16.5 8.51m-9.02 9.02L5.97 15.49m9.02-9.02l2.48-2.48M5.97 5.97l2.48 2.48" />
  </svg>
);
