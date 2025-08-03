import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationMessageProps } from "@/types/trip-wizard";

export function ValidationMessage({ error, success, info }: ValidationMessageProps) {
  if (!error && !success && !info) return null;
  
  const message = error || success || info;
  const type = error ? 'error' : success ? 'success' : 'info';
  
  return (
    <div 
      className={cn(
        "flex items-center space-x-2 text-sm mt-2 p-2 rounded-md",
        type === 'error' && "text-red-700 bg-red-50 border border-red-200",
        type === 'success' && "text-green-700 bg-green-50 border border-green-200",
        type === 'info' && "text-blue-700 bg-blue-50 border border-blue-200"
      )}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
      {type === 'info' && <Info className="w-4 h-4 flex-shrink-0" />}
      <span>{message}</span>
    </div>
  );
}