export const buttonComponent = {
  name: 'Button',
  location: '.',
  dependencies: [

  ],
  content: `
import React from 'react';
export function Button({ children }: { children: string }) {
  return <button>{children}</button>;
}
`
};