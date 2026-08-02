import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <FileQuestion className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <h2 className="text-xl font-semibold">Page Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The page or candidate resume record you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
