const StepErrorBoundary = ({ children, onRetry }: ErrorBoundaryProps) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <CardTitle className="mb-2">Something went wrong</CardTitle>
        <CardDescription className="mb-4">
          We encountered an error while loading this step. Please try again.
        </CardDescription>
        <Button
          onClick={() => {
            setHasError(false);
            onRetry?.();
          }}
          className="w-full sm:w-auto"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </Card>
    );
  }

  return children;
};
