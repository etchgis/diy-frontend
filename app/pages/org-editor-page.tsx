'use client';
import { useEffect, useState } from 'react';
import { SetupSlides } from '@/services/setup';
import { useGeneralStore } from '@/stores/general';
import EditorPage from './editor-page';

export default function OrgEditorPage({
  orgId,
  diyShortcode,
}: {
  orgId: string;
  diyShortcode?: string;
}) {
  const setCurrentOrgId = useGeneralStore((state) => state.setCurrentOrgId);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCurrentOrgId(orgId);
    if (diyShortcode) {
      SetupSlides(diyShortcode).then(() => setReady(true));
    } else {
      setReady(true);
    }
    return () => setCurrentOrgId(undefined);
  }, [orgId, diyShortcode]);

  if (!ready) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-sm">Loading {orgId} editor...</p>
      </div>
    );
  }

  return <EditorPage />;
}
