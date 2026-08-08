import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';

type ItemDetailShellProps = {
  backgroundClassName: string;
  header: ReactNode;
  gallery?: ReactNode;
  content: ReactNode;
  sidebar?: ReactNode;
};

export default function ItemDetailShell({
  backgroundClassName,
  header,
  gallery,
  content,
  sidebar,
}: ItemDetailShellProps) {
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${backgroundClassName}`}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-white/60"
        >
          <ChevronLeft className="mr-2 size-4" />
          Back
        </Button>

        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="p-8 pb-6">{header}</div>

          {gallery ? <div className="px-8 pb-8">{gallery}</div> : null}

          <div className="p-8 pt-0">
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.6fr_0.9fr]">
              <div>{content}</div>
              {sidebar ? <div>{sidebar}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}