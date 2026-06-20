import { useEffect } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { useAppStore } from '@/store/useAppStore';
import { useSystemInfo } from '@/hooks/useTauri';

function App() {
  const activeTab = useAppStore((s) => s.activeTab);
  const { fetchSystemInfo } = useSystemInfo();

  useEffect(() => {
    fetchSystemInfo();
  }, [fetchSystemInfo]);

  return (
    <div className="h-full flex flex-col">
      <AppLayout />
    </div>
  );
}

export default App;