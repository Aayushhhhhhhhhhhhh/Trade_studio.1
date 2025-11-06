import { Loader } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
