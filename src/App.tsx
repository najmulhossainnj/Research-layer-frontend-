import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { quantTheme } from './theme';
import { useUIStore } from './store/useUIStore';

// Components
import { GlobalHeader } from './components/common/GlobalHeader';
import { SidebarNav } from './components/common/SidebarNav';

// Pages
import { StrategyExplorer } from './pages/StrategyExplorer';
import { StrategyBuilder } from './pages/StrategyBuilder';
import { FeatureBuilder } from './pages/FeatureBuilder';
import { ModelBuilder } from './pages/ModelBuilder';
import { SignalBuilder } from './pages/SignalBuilder';
import { BacktestLab } from './pages/BacktestLab';
import { ExperimentTracker } from './pages/ExperimentTracker';
import { ValidationCenter } from './pages/ValidationCenter';
import { AIResearcher } from './pages/AIResearcher';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000
    }
  }
});

export function AppContent() {
  const { activeWorkspace } = useUIStore();

  const renderWorkspace = () => {
    switch (activeWorkspace) {
      case 'explorer':
        return <StrategyExplorer />;
      case 'strategy_builder':
        return <StrategyBuilder />;
      case 'feature_builder':
        return <FeatureBuilder />;
      case 'model_builder':
        return <ModelBuilder />;
      case 'signal_builder':
        return <SignalBuilder />;
      case 'backtest_lab':
        return <BacktestLab />;
      case 'experiment_tracker':
        return <ExperimentTracker />;
      case 'validation_center':
        return <ValidationCenter />;
      case 'ai_researcher':
        return <AIResearcher />;
      default:
        return <StrategyExplorer />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050505] text-[#E8ECF4] overflow-hidden antialiased font-sans selection:bg-[#c5a059] selection:text-black">
      {/* Global Terminal Header */}
      <GlobalHeader />

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        <SidebarNav />
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[#050505]">
          {renderWorkspace()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={quantTheme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
