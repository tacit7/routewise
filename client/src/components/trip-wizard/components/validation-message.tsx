const ValidationMessage = ({ error, success, info }: ValidationProps) => {
  if (!error && !success && !info) return null;

  return (
    <div
      className={cn(
        "flex items-center space-x-2 text-sm mt-2 p-2 rounded-md",
        error && "text-red-700 bg-red-50 border border-red-200",
        success && "text-green-700 bg-green-50 border border-green-200",
        info && "text-blue-700 bg-blue-50 border border-blue-200"
      )}
    >
      {error && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {success && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
      {info && <Info className="w-4 h-4 flex-shrink-0" />}
      <span>{error || success || info}</span>
    </div>
  );
};
