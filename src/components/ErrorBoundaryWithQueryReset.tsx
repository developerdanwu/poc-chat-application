import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary, type ErrorBoundaryProps } from 'react-error-boundary';

const ErrorBoundaryWithQueryReset = ({
  children,
  onReset,
  ...props
}: ErrorBoundaryProps) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={(...args) => {
            reset();
            onReset?.(...args);
          }}
          {...props}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

export default ErrorBoundaryWithQueryReset;
