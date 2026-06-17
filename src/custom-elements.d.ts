import React from 'react';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'deck-stage': any;
        'image-slot': any;
      }
    }
  }
  
  namespace JSX {
    interface IntrinsicElements {
      'deck-stage': any;
      'image-slot': any;
    }
  }
}
