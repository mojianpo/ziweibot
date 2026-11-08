import Link from 'next/link';
import { redirect } from 'next/navigation';
import BirthForm from '@/components/BirthForm';
import { getService } from '@/lib/service';
import { currentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function NewProfilePage() {
  if (!await currentUser()) redirect('/account');
  const years = getService().coverage().indexedYears;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <h1 className="mb-6 font-sans text-[1.45rem] font-semibold leading-snug tracking-[0.04em] text-ink sm:text-[1.6rem]">
        排一张新盘
      </h1>

      <BirthForm indexedYears={years} />

      <p className="mt-4 text-xs text-ink-2">
        <Link
          href="/"
          className="underline underline-offset-2 transition-colors hover:text-zhu focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zhu"
        >
          ← 回到命盘对话
        </Link>
      </p>
    </div>
  );
}
