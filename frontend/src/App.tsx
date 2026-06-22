import { useEffect } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { useSystemInfo } from '@/hooks/useTauri';

function App() {
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