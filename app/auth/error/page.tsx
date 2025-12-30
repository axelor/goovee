import Link from 'next/link';
import {AlertCircle, ArrowLeft} from 'lucide-react';

import {Button} from '@/ui/components/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';

export default async function Page(props: {
  searchParams: Promise<{error: string; workspaceURI: string}>;
}) {
  const searchParams = await props.searchParams;
  const {error, workspaceURI} = searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{error}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Error code: {error}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild variant="outline" className="w-full">
            <Link href={workspaceURI || '/'}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workspace
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
