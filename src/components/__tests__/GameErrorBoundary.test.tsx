import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';

// Silence the noisy expected console.error from React's error logging during these tests.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  localStorage.clear();
});

const Boom: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) throw new Error('kaboom');
  return <div>healthy child</div>;
};

describe('GameErrorBoundary', () => {
  it('renders children normally when no error', () => {
    render(
      <GameErrorBoundary onExitToMenu={() => {}} onRestart={() => {}}>
        <Boom shouldThrow={false} />
      </GameErrorBoundary>,
    );
    expect(screen.getByText('healthy child')).toBeInTheDocument();
  });

  it('shows recovery UI on render error and records crash report', () => {
    render(
      <GameErrorBoundary
        onExitToMenu={() => {}}
        onRestart={() => {}}
        getSnapshot={() => ({ turn: 7 })}
      >
        <Boom shouldThrow={true} />
      </GameErrorBoundary>,
    );

    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try to continue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restart same family/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return to menu/i })).toBeInTheDocument();

    const stored = localStorage.getItem('lastCrashReport');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.message).toContain('kaboom');
    expect(parsed.snapshot).toEqual({ turn: 7 });
  });

  it('"Try to continue" resets and re-renders the child', () => {
    let throws = true;
    const Child: React.FC = () => {
      if (throws) throw new Error('first try fails');
      return <div>recovered child</div>;
    };

    render(
      <GameErrorBoundary onExitToMenu={() => {}} onRestart={() => {}}>
        <Child />
      </GameErrorBoundary>,
    );

    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    throws = false;
    fireEvent.click(screen.getByRole('button', { name: /try to continue/i }));
    expect(screen.getByText('recovered child')).toBeInTheDocument();
  });

  it('"Return to menu" calls onExitToMenu', async () => {
    const onExit = vi.fn();
    render(
      <GameErrorBoundary onExitToMenu={onExit} onRestart={() => {}}>
        <Boom shouldThrow={true} />
      </GameErrorBoundary>,
    );
    fireEvent.click(screen.getByRole('button', { name: /return to menu/i }));
    await Promise.resolve();
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
