import type { ReactNode } from 'react';

import { Button, type ButtonProps } from '@/components/ui/Button';

export type ButtonOutlineProps = Omit<ButtonProps, 'variant'> & {
  children: ReactNode;
};

/** Outlined button — same API intent as web `ButtonOutline`. */
export function ButtonOutline(props: ButtonOutlineProps) {
  return <Button variant="outlined" {...props} />;
}
