import { UnstyledButton } from '@mantine/core';
import type { KeyboardEvent } from 'react';
import { useCameraPtz } from '../../hooks/useCameraPtz';
import type { PtzDirection } from '../../types/ptz-direction';
import classes from './CameraPtzControls.module.css';

const BUTTONS: { direction: PtzDirection; label: string; points: string }[] = [
  { direction: 'left', label: 'Move camera left', points: '15 5 8 12 15 19' },
  { direction: 'right', label: 'Move camera right', points: '9 5 16 12 9 19' },
];

const isActivationKey = (event: KeyboardEvent) =>
  event.key === 'Enter' || event.key === ' ';

export function CameraPtzControls() {
  const { start, stop } = useCameraPtz();

  return (
    <>
      {BUTTONS.map(({ direction, label, points }) => (
        <UnstyledButton
          key={direction}
          aria-label={label}
          title={label}
          className={`${classes.arrow} ${classes[direction]}`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            start(direction);
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
          onKeyDown={(event) => {
            if (isActivationKey(event) && !event.repeat) {
              event.preventDefault();
              start(direction);
            }
          }}
          onKeyUp={(event) => {
            if (isActivationKey(event)) stop();
          }}
          onBlur={stop}
        >
          <svg
            className={classes.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ display: 'block', margin: 'auto' }}
          >
            <polyline points={points} />
          </svg>
        </UnstyledButton>
      ))}
    </>
  );
}
