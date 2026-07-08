import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useResearchSessionStore } from '../../store/useResearchSessionStore';
import { useUIStore } from '../../store/useUIStore';
import {
  submitResearchQuery,
  chatWithAgent,
  getSessionContext,
  listAgentSessions,
  getFeatures,
  getStrategies,
  promoteStrategy
} from '../../api/client';
import { API_BASE_URL } from '../../api/config';
import { Feature, Strategy } from '../../types';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Send,
  Terminal,
  Cpu,
  Layers,
  Activity,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Shield,
  Plus,
  RefreshCw,
  Copy,
  FolderKanban,
  Check,
  Code,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Play,
  ArrowRight
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreamed?: boolean;
}

interface AgentStep {
  role: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  summary: string;
}

export const AIResearcher: React.FC = () => {
  const queryClient = useQueryClient();
  const store = useResearchSessionStore();
  const { setWorkspace, selectStrategy } = useUIStore();

  // Fetch strategies
  const { data: strategies = [] } = useQuery<Strategy[]>({
    queryKey: ['strategies'],
    queryFn: getStrategies
  });

  // Selected session context state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(store.sessionId || 'sess_a3f2c1d8');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to the **Agentic Quant Research Desk**. Describe the trading strategy you want to construct, and our multi-agent pipeline will discover features, train models, execute backtests, and run formal validation audits.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Simulated live context panel state
  const [liveContext, setLiveContext] = useState<{
    strategyName: string;
    status: 'empty' | 'building' | 'validated' | 'halted';
    universe: string[];
    timeframe: string;
    dateRange: string;
    features: string[];
    model: string;
    modelParams: string;
    backtest: {
      sharpe: string;
      cagr: string;
      maxDrawdown: string;
      winRate: string;
      bars: string;
      trades: string;
    } | null;
    validation: {
      wf: string;
      cpcv: string;
      pbo: string;
      deflatedSharpe: string;
      overfitting: string;
    } | null;
    governance: {
      status: string;
      warnings: string[];
      critical: string[];
    } | null;
  }>({
    strategyName: '',
    status: 'empty',
    universe: [],
    timeframe: '',
    dateRange: '',
    features: [],
    model: '',
    modelParams: '',
    backtest: null,
    validation: null,
    governance: null
  });

  // Streaming & timing controls
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPromoted, setIsPromoted] = useState(false);

  // Sub-agent timeline state - matches backend AgentRole enum
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([
    { role: 'market_data', label: '🔬 Market Data', status: 'pending', summary: 'Awaiting data ingestion' },
    { role: 'feature_discovery', label: '⚙️ Feature Discovery', status: 'pending', summary: 'Awaiting feature extraction' },
    { role: 'model_discovery', label: '⚙️ Model Discovery', status: 'pending', summary: 'Awaiting model selection' },
    { role: 'hyperparameter', label: '⚙️ Hyperparameter Tuning', status: 'pending', summary: 'Awaiting parameter tuning' },
    { role: 'backtest', label: '⚙️ Backtest Engine', status: 'pending', summary: 'Awaiting backtest execution' },
    { role: 'validation', label: '⚙️ Validation', status: 'pending', summary: 'Awaiting walk-forward & CPCV' },
    { role: 'governance', label: '⚙️ Governance', status: 'pending', summary: 'Awaiting governance review' }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep chat scrolled to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, agentSteps]);

  // Copy utility
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  // Run the real backend-powered research pipeline using SSE streaming
  const runRealResearchPipeline = async (query: string) => {
    setIsStreaming(true);
    setIsPromoted(false);
    
    // Reset live context
    setLiveContext({
      strategyName: 'Initializing Pipeline...',
      status: 'building',
      universe: [],
      timeframe: '',
      dateRange: '',
      features: [],
      model: '',
      modelParams: '',
      backtest: null,
      validation: null,
      governance: null
    });

    // Reset agent steps to initial state
    setAgentSteps([
      { role: 'market_data', label: '🔬 Market Data', status: 'running', summary: 'Starting pipeline...' },
      { role: 'feature_discovery', label: '⚙️ Feature Discovery', status: 'pending', summary: 'Awaiting feature extraction' },
      { role: 'model_discovery', label: '⚙️ Model Discovery', status: 'pending', summary: 'Awaiting model selection' },
      { role: 'hyperparameter', label: '⚙️ Hyperparameter Tuning', status: 'pending', summary: 'Awaiting parameter tuning' },
      { role: 'backtest', label: '⚙️ Backtest Engine', status: 'pending', summary: 'Awaiting backtest execution' },
      { role: 'validation', label: '⚙️ Validation', status: 'pending', summary: 'Awaiting walk-forward & CPCV' },
      { role: 'governance', label: '⚙️ Governance', status: 'pending', summary: 'Awaiting governance review' }
    ]);

    // Use SSE streaming via EventSource
    const eventSource = new EventSource(`${API_BASE_URL}/agents/research/stream?query=${encodeURIComponent(query)}`);

    let sessionId = '';
    let strategyId = '';

    // Add initial message
    setMessages((prev) => [
      ...prev,
      {
        id: `step_init_${Date.now()}`,
        role: 'assistant',
        content: `🔬 **Research session starting**\n\n*"${query}"*\n\nInitializing agentic orchestration pipeline...`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.event) {
          case 'start':
            sessionId = data.session_id;
            strategyId = data.strategy_id || '';
            setActiveSessionId(sessionId);
            
            setMessages((prev) => [
              ...prev,
              {
                id: `step_${data.event}_${Date.now()}`,
                role: 'assistant',
                content: `✅ **Research session started**\n\nSession ID: \`${sessionId}\`\nStrategy ID: \`${strategyId || 'Creating...'}\`\n\nStarting agentic orchestration pipeline...`,
                timestamp: new Date().toLocaleTimeString()
              }
            ]);
            break;

          case 'agent_start':
            setAgentSteps((prev) =>
              prev.map((s) =>
                s.role === data.role
                  ? { ...s, status: 'running', summary: data.message || `Running ${data.role}...` }
                  : s
              )
            );
            break;

          case 'agent_done':
            // Format the result message based on agent type
            const resultMessage = formatAgentResult(data.role, data);
            
            setMessages((prev) => [
              ...prev,
              {
                id: `step_${data.role}_${Date.now()}`,
                role: 'assistant',
                content: resultMessage,
                timestamp: new Date().toLocaleTimeString()
              }
            ]);

            // Update agent step status
            setAgentSteps((prev) =>
              prev.map((s) =>
                s.role === data.role
                  ? {
                      ...s,
                      status: data.success ? 'completed' : 'error',
                      summary: data.summary || (data.success ? 'Completed' : 'Failed')
                    }
                  : s
              )
            );

            // Update live context based on agent results
            updateLiveContext(data.role, data);
            break;

          case 'pipeline_halted':
            setMessages((prev) => [
              ...prev,
              {
                id: `step_halted_${Date.now()}`,
                role: 'assistant',
                content: `🛑 **Pipeline halted — critical governance flags**\n\n${data.reason || 'Unknown reason'}\n\n${data.flags?.map((f: string) => `- ${f}`).join('\n') || ''}\n\nThe strategy has been blocked from promotion.`,
                timestamp: new Date().toLocaleTimeString()
              }
            ]);
            break;

          case 'complete':
            const finalContext = data.context || {};
            
            setMessages((prev) => [
              ...prev,
              {
                id: `step_complete_${Date.now()}`,
                role: 'assistant',
                content: finalContext.validation_passed
                  ? `✅ **Research complete — Strategy validated!**\n\nThe strategy has passed all validation checks and is ready for promotion.`
                  : `⚠️ **Research complete — Validation issues detected**\n\nThe strategy requires attention before promotion. Check the validation results above.`,
                timestamp: new Date().toLocaleTimeString()
              }
            ]);

            // Update live context with final state
            setLiveContext((prev) => ({
              ...prev,
              status: finalContext.validation_passed ? 'validated' : 'building',
              strategyName: finalContext.name || `Strategy ${strategyId}`,
            }));

            // Mark all steps complete
            setAgentSteps((prev) =>
              prev.map((s) => ({
                ...s,
                status: 'completed'
              }))
            );

            // Update store
            store.mergeContext({
              sessionId: sessionId,
              strategyId: strategyId,
              featureIds: finalContext.feature_ids || [],
              modelId: finalContext.model_id,
              backtestIds: finalContext.backtest_ids || [],
              bestModelPlugin: finalContext.best_model_plugin,
              governanceFlags: finalContext.governance_flags || [],
              validationPassed: finalContext.validation_passed || false,
              convictionScore: finalContext.conviction_score || 0.8
            });

            eventSource.close();
            setIsStreaming(false);
            break;
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      eventSource.close();
      
      setMessages((prev) => [
        ...prev,
        {
          id: `step_err_${Date.now()}`,
          role: 'assistant',
          content: `🛑 **Connection Error**\n\nFailed to receive updates from the agentic system. The pipeline may have been interrupted.\n\nPlease try again or check that the backend is running at \`${API_BASE_URL}\`.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      
      setAgentSteps((prev) =>
        prev.map((s) =>
          s.status === 'running' ? { ...s, status: 'error', summary: 'Connection lost' } : s
        )
      );
      setIsStreaming(false);
    };
  };

  // Format agent result into a readable message
  const formatAgentResult = (role: string, data: any): string => {
    const { success, summary, details, errors } = data;
    const prefix = success ? '✓' : '✗';
    
    switch (role) {
      case 'feature_discovery':
        if (!success) return `⚙️ **Feature Discovery**\n\n${prefix} ${summary}\n\n${errors?.join(', ') || 'Unknown error'}`;
        
        const candidates = details?.candidates || [];
        const featureNames = candidates.map((f: any) => `\`${f.plugin_key}\``).join(', ');
        
        return `⚙️ **Feature Discovery complete**\n\n${prefix} ${summary}\n\n**Discovered ${candidates.length} candidate features:**\n${featureNames}\n\n${details?.shap_importance && Object.keys(details.shap_importance).length > 0 
  ? `**Top signals:** ${Object.entries(details.shap_importance).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ')}`
  : ''}`;

      case 'model_discovery':
        if (!success) return `⚙️ **Model Discovery**\n\n${prefix} ${summary}\n\n${errors?.join(', ') || 'Unknown error'}`;
        
        const leaderboard = details?.leaderboard || [];
        const selected = details?.selected || 'Unknown';
        
        return `⚙️ **Model Discovery complete**\n\n${prefix} ${summary}\n\n**Leaderboard:**\n${leaderboard.map((m: any, i: number) => `${i + 1}. \`${m.plugin_key}\` — ${m.score !== null ? `Score: ${m.score}` : 'No score'}`).join('\n')}\n\n**Selected:** ${selected}`;

      case 'hyperparameter':
        if (!success) return `⚙️ **Hyperparameter Tuning**\n\n${prefix} ${summary}\n\n${errors?.join(', ') || 'Unknown error'}`;
        
        const bestParams = details?.best_params || {};
        const paramStr = Object.entries(bestParams).map(([k, v]) => `${k}=${v}`).join(', ');
        
        return `⚙️ **Hyperparameter Tuning complete**\n\n${prefix} ${summary}\n\n**Best parameters:** ${paramStr || 'Using defaults'}`;

      case 'backtest':
        if (!success) return `⚙️ **Backtest**\n\n${prefix} ${summary}\n\n${errors?.join(', ') || 'Unknown error'}`;
        
        const metrics = details?.metrics || {};
        return `⚙️ **Backtest complete**\n\n${prefix} ${summary}\n\n**Metrics:**\n- Sharpe: **${metrics.sharpe_ratio || 'N/A'}**\n- CAGR: **${metrics.cagr || 'N/A'}**\n- Max Drawdown: **${metrics.max_drawdown || 'N/A'}**\n- Win Rate: **${metrics.win_rate || 'N/A'}**\n\n${metrics.total_trades ? `Trades: ${metrics.total_trades}` : ''}`;

      case 'validation':
        if (!success) return `⚙️ **Validation**\n\n${prefix} ${summary}\n\n${errors?.join(', ') || 'Unknown error'}`;
        
        const wf = details?.walk_forward || {};
        const cpcv = details?.cpcv || {};
        
        return `⚙️ **Validation complete**\n\n${prefix} ${summary}\n\n**Walk-Forward (5 folds, rolling):**\n- OOS Sharpe: **${wf.mean_oos_sharpe || 'N/A'}**\n- Profitable folds: **${wf.profitable_folds || 'N/A'}**\n\n**CPCV:**\n- PBO: **${cpcv.pbo || 'N/A'}**\n- Deflated Sharpe: **${cpcv.deflated_sharpe || 'N/A'}**\n\n**Overfitting score:** ${details?.overfitting_score || 'N/A'}`;

      case 'governance':
        const flags = details?.governance_flags || [];
        const warnings = flags.filter((f: string) => f.includes('WARNING') || f.includes('⚠️'));
        const critical = flags.filter((f: string) => f.includes('CRITICAL'));
        
        return `⚙️ **Governance check complete**\n\n${critical.length > 0 ? '🛑 **CRITICAL ISSUES:**\n' + critical.map((f: string) => `- ${f}`).join('\n') + '\n\n' : ''}${warnings.length > 0 ? '⚠️ **Warnings:**\n' + warnings.map((f: string) => `- ${f}`).join('\n') + '\n\n' : ''}${flags.length === 0 ? '✅ No issues detected' : ''}`;

      default:
        return `${prefix} **${role}**\n\n${prefix} ${summary}\n\n${errors?.length > 0 ? `Errors: ${errors.join(', ')}` : ''}`;
    }
  };

  // Update live context panel based on agent results
  const updateLiveContext = (role: string, data: any) => {
    setLiveContext((prev) => {
      const updates: any = { ...prev };
      
      switch (role) {
        case 'feature_discovery':
          updates.features = data.details?.candidates?.map((f: any) => f.plugin_key) || [];
          break;
          
        case 'model_discovery':
          updates.model = data.details?.selected || '';
          break;
          
        case 'hyperparameter':
          updates.modelParams = data.details?.best_params 
            ? Object.entries(data.details.best_params).map(([k, v]) => `${k}=${v}`).join(', ')
            : '';
          break;
          
        case 'backtest':
          if (data.details?.metrics) {
            const m = data.details.metrics;
            updates.backtest = {
              sharpe: m.sharpe_ratio || 'N/A',
              cagr: m.cagr || 'N/A',
              maxDrawdown: m.max_drawdown || 'N/A',
              winRate: m.win_rate || 'N/A',
              bars: m.total_bars || 'N/A',
              trades: m.total_trades || 'N/A'
            };
          }
          break;
          
        case 'validation':
          if (data.details) {
            updates.validation = {
              wf: data.details.walk_forward?.passed ? '✓ Passed' : 'Failed',
              cpcv: data.details.cpcv?.skipped ? 'Skipped' : '✓ Active',
              pbo: data.details.cpcv?.pbo || 'N/A',
              deflatedSharpe: data.details.cpcv?.deflated_sharpe || 'N/A',
              overfitting: data.details.overfitting_score || 'N/A'
            };
          }
          break;
          
        case 'governance':
          if (data.details?.governance_flags) {
            const flags = data.details.governance_flags;
            updates.governance = {
              status: data.success ? 'Passed' : 'Failed',
              warnings: flags.filter((f: string) => f.includes('WARNING')),
              critical: flags.filter((f: string) => f.includes('CRITICAL'))
            };
          }
          break;
      }
      
      return updates;
    });
  };

  const handleSend = () => {
    const prompt = input.trim();
    if (!prompt || isStreaming) return;

    // Append User Message
    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Trigger the real, live backend pipeline execution
    runRealResearchPipeline(prompt);
  };

  const handlePromote = async () => {
    if (liveContext.status === 'halted' || liveContext.status === 'empty' || !activeSessionId) return;
    try {
      await promoteStrategy(activeSessionId);
      setIsPromoted(true);
      setToastMessage('SUCCESS // Strategy successfully promoted to Portfolio Layer.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to promote strategy:', err);
      setToastMessage(`ERROR // Failed to promote: ${err.message || err.toString()}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="flex-1 flex bg-[#050505] text-[#d4d4d4] font-sans h-full overflow-hidden relative">
      
      {/* LEFT COLUMN: THE CHAT CONTAINER */}
      <div className="flex-1 flex flex-col h-full border-r border-[#1a1a1a] overflow-hidden">
        
        {/* Chat Companion Header */}
        <div className="p-4 bg-[#0a0a0a] border-b border-[#1a1a1a] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-[#f97316] animate-pulse' : 'bg-[#2ECC8F]'}`}></span>
            <div>
              <span className="text-[11px] font-bold text-white tracking-wider uppercase font-sans">AI RESEARCH COMPANION</span>
              <span className="text-[9px] font-mono text-gray-500 block">Session ID: a3f2c1d8</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome',
                    role: 'assistant',
                    content: 'Desk re-initialized. Describe the trading strategy you want to construct, and our multi-agent pipeline will deploy.',
                    timestamp: new Date().toLocaleTimeString()
                  }
                ]);
                setLiveContext({
                  strategyName: '',
                  status: 'empty',
                  universe: [],
                  timeframe: '',
                  dateRange: '',
                  features: [],
                  model: '',
                  modelParams: '',
                  backtest: null,
                  validation: null,
                  governance: null
                });
                setIsPromoted(false);
              }}
              className="text-[10px] font-mono text-gray-500 hover:text-white bg-[#111] border border-[#222] px-2.5 py-1 rounded cursor-pointer uppercase transition-colors"
            >
              Clear Session
            </button>
          </div>
        </div>

        {/* Conversation Message List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#888888]">
                  {m.role === 'user' ? 'RESEARCHER' : 'SYSTEM MANAGER'}
                </span>
                <span className="text-[8px] font-mono text-gray-600">{m.timestamp}</span>
              </div>

              <div
                className={`p-3.5 rounded-lg max-w-[85%] text-[12px] leading-relaxed shadow-lg border ${
                  m.role === 'user'
                    ? 'bg-[#141d2f] border-[#223554] text-white rounded-tr-none'
                    : 'bg-[#0a0a0f] border-[#16161f] text-[#d4d4d4] rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.content.includes('vectorbt') && (
                  <div className="mt-2 text-[9px] font-mono bg-[#050508] border border-[#1a1a24] p-1.5 rounded flex justify-between items-center">
                    <span className="text-gray-500 font-bold flex items-center gap-1">
                      <Code className="w-3 h-3 text-[#c5a059]" /> AAPL_VECTOR_ALPHA.PY
                    </span>
                    <button
                      onClick={() => handleCopy(m.content, m.id)}
                      className="text-gray-400 hover:text-white text-[8px] uppercase font-bold cursor-pointer"
                    >
                      {copiedTextId === m.id ? 'Copied' : 'Copy Code'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Real-time Sub-Agent Progress timelines */}
          {isStreaming && (
            <div className="bg-[#08080c] border border-[#161622] p-4 rounded-lg space-y-3 max-w-[85%] shadow-xl animate-fadeIn">
              <div className="flex justify-between items-center pb-2 border-b border-[#161622]">
                <span className="text-[10px] font-mono font-bold text-[#f97316] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3 animate-pulse text-[#f97316]" />
                  SSE Live Telemetry Channels
                </span>
                <span className="text-[8px] font-mono text-gray-500 uppercase animate-pulse">PROCESSING...</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {agentSteps.map((step) => {
                  const isRunning = step.status === 'running';
                  const isDone = step.status === 'completed';
                  const isErr = step.status === 'error';

                  return (
                    <div
                      key={step.role}
                      className={`p-2 rounded border transition-all flex items-center justify-between text-[10px] font-mono ${
                        isRunning
                          ? 'bg-[#f97316]/5 border-[#f97316]/30'
                          : isDone
                          ? 'bg-[#2ECC8F]/5 border-[#2ECC8F]/20'
                          : isErr
                          ? 'bg-red-950/10 border-red-900/30'
                          : 'bg-[#06060a] border-transparent opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isRunning ? (
                          <CircularProgress size={10} className="text-[#f97316]" color="inherit" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC8F]" />
                        ) : isErr ? (
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-gray-600" />
                        )}
                        <span className="font-bold text-gray-300">{step.label}</span>
                      </div>
                      <span className="text-[9px] text-gray-500 truncate max-w-[200px]">
                        {step.summary}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Command Input Bar at bottom */}
        <div className="p-4 bg-[#0a0a0a] border-t border-[#1a1a1a] shrink-0">
          
          {/* Preset Buttons above Input */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none select-none">
            <button
              onClick={() => setInput("Build a momentum strategy using RSI and news sentiment on AAPL using XGBoost, test it from 2020 to 2024")}
              className="text-[10px] font-mono text-gray-400 hover:text-white bg-[#111115] border border-[#222] px-3 py-1.5 rounded-full shrink-0 transition-all cursor-pointer"
            >
              "Build AAPL Momentum Strategy"
            </button>
            <button
              onClick={() => setInput("Compare XGBoost with LightGBM on the same setup")}
              className="text-[10px] font-mono text-gray-400 hover:text-white bg-[#111115] border border-[#222] px-3 py-1.5 rounded-full shrink-0 transition-all cursor-pointer"
            >
              "Compare XGBoost vs LightGBM"
            </button>
            <button
              onClick={() => setInput("What was the worst drawdown period and what news was happening then?")}
              className="text-[10px] font-mono text-gray-400 hover:text-white bg-[#111115] border border-[#222] px-3 py-1.5 rounded-full shrink-0 transition-all cursor-pointer"
            >
              "Worst Drawdown & News Analysis"
            </button>
            <button
              onClick={() => setInput("Run simulation with short date range to test governance flags")}
              className="text-[10px] font-mono text-gray-400 hover:text-white bg-[#111115] border border-[#222] px-3 py-1.5 rounded-full shrink-0 transition-all cursor-pointer text-red-400/80 hover:text-red-300"
            >
              "Test Governance Halt"
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Orchestrate pipeline: e.g. 'Build momentum strategy using RSI on AAPL'..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isStreaming}
              className="flex-1 bg-[#121212] border border-[#222] text-white font-sans text-xs rounded-lg px-4 py-3 outline-none focus:border-[#f97316] transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="bg-[#f97316] text-black font-sans font-bold hover:bg-[#d95d00] uppercase tracking-wider px-5 text-xs rounded-lg flex items-center gap-1.5 shrink-0 transition-all cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              Execute
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE CONTEXT TELEMETRY PANEL */}
      <div className="w-80 bg-[#080808] p-4 flex flex-col shrink-0 overflow-y-auto space-y-4 select-none scrollbar-thin">
        
        <div className="pb-2 border-b border-[#1a1a1a] flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#c5a059]" />
            LIVE TELEMETRY PANEL
          </span>
          {liveContext.status !== 'empty' && (
            <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
              liveContext.status === 'building' 
                ? 'bg-yellow-500/10 text-yellow-500 animate-pulse'
                : liveContext.status === 'validated'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {liveContext.status}
            </span>
          )}
        </div>

        {liveContext.status === 'empty' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-24 px-4 space-y-3">
            <Sparkles className="w-8 h-8 text-gray-700 animate-pulse" />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Awaiting Stream Context</span>
            <p className="text-[10px] text-gray-600 leading-relaxed font-sans">
              Enter a pipeline query or select a preset to see real-time agent context populate here.
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Strategy Scope */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-3 rounded-lg space-y-2">
              <span className="text-[9px] font-mono text-gray-500 uppercase font-bold tracking-wider block">1. Strategy Scope</span>
              <div className="space-y-1 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-600">Universe:</span>
                  <span className="text-white font-bold">{liveContext.universe.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Interval:</span>
                  <span className="text-white">{liveContext.timeframe}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timeframe:</span>
                  <span className="text-white text-[9px]">{liveContext.dateRange}</span>
                </div>
              </div>
            </div>

            {/* Discovered Features */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-3 rounded-lg space-y-2">
              <span className="text-[9px] font-mono text-gray-500 uppercase font-bold tracking-wider block">2. Discovered Features</span>
              {liveContext.features.length === 0 ? (
                <div className="text-[9px] font-mono text-gray-600 italic animate-pulse">Running FeatureDiscoveryAgent...</div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {liveContext.features.map(f => (
                    <span key={f} className="text-[8.5px] font-mono bg-purple-950/20 text-purple-400 border border-purple-900/40 px-1.5 py-0.5 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Model discovery */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-3 rounded-lg space-y-2">
              <span className="text-[9px] font-mono text-gray-500 uppercase font-bold tracking-wider block">3. Best Candidate Model</span>
              {!liveContext.model ? (
                <div className="text-[9px] font-mono text-gray-600 italic animate-pulse">Running ModelTrainingAgent...</div>
              ) : (
                <div className="space-y-1.5 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Algorithm:</span>
                    <span className="text-[#c5a059] font-bold">{liveContext.model}</span>
                  </div>
                  {liveContext.modelParams && (
                    <div className="bg-[#050505] p-1.5 rounded border border-[#151515] text-[9px] text-gray-400 leading-normal">
                      {liveContext.modelParams}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Backtest metrics */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-3 rounded-lg space-y-2">
              <span className="text-[9px] font-mono text-gray-500 uppercase font-bold tracking-wider block">4. Backtest performance</span>
              {!liveContext.backtest ? (
                <div className="text-[9px] font-mono text-gray-600 italic animate-pulse">Awaiting BacktestAgent...</div>
              ) : (
                <div className="space-y-2 text-[10px] font-mono">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-[#111] p-1.5 rounded border border-[#222]">
                      <span className="text-[7.5px] text-gray-500 uppercase block">Sharpe</span>
                      <span className="text-emerald-400 font-bold text-xs">{liveContext.backtest.sharpe}</span>
                    </div>
                    <div className="bg-[#111] p-1.5 rounded border border-[#222]">
                      <span className="text-[7.5px] text-gray-500 uppercase block">CAGR</span>
                      <span className="text-emerald-400 font-bold text-xs">{liveContext.backtest.cagr}</span>
                    </div>
                    <div className="bg-[#111] p-1.5 rounded border border-[#222]">
                      <span className="text-[7.5px] text-gray-500 uppercase block">Max DD</span>
                      <span className="text-red-400 font-bold text-xs">{liveContext.backtest.maxDrawdown}</span>
                    </div>
                    <div className="bg-[#111] p-1.5 rounded border border-[#222]">
                      <span className="text-[7.5px] text-gray-500 uppercase block">Win Rate</span>
                      <span className="text-emerald-400 font-bold text-xs">{liveContext.backtest.winRate}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-500 pt-1 border-t border-[#151515]">
                    <span>Bars: {liveContext.backtest.bars}</span>
                    <span>Trades: {liveContext.backtest.trades}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Validation center */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-3 rounded-lg space-y-2">
              <span className="text-[9px] font-mono text-gray-500 uppercase font-bold tracking-wider block">5. Validation Metrics</span>
              {!liveContext.validation ? (
                <div className="text-[9px] font-mono text-gray-600 italic animate-pulse">Awaiting ValidationAgent...</div>
              ) : (
                <div className="space-y-1.5 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Walk-Forward:</span>
                    <span className="text-emerald-400">{liveContext.validation.wf}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPCV Paths:</span>
                    <span className="text-emerald-400">{liveContext.validation.cpcv}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">PBO score:</span>
                    <span className="text-white">{liveContext.validation.pbo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deflated Sharpe:</span>
                    <span className="text-white">{liveContext.validation.deflatedSharpe}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Governance audits */}
            {liveContext.governance && (
              <div className={`p-3 rounded-lg border text-[10px] font-mono space-y-1.5 ${
                liveContext.status === 'halted'
                  ? 'bg-red-950/10 border-red-900/30 text-red-200'
                  : 'bg-emerald-950/10 border-emerald-900/30 text-emerald-200'
              }`}>
                <div className="flex justify-between font-bold">
                  <span>Governance Audit:</span>
                  <span className={liveContext.status === 'halted' ? 'text-red-400' : 'text-emerald-400'}>
                    {liveContext.governance.status}
                  </span>
                </div>
                {liveContext.governance.warnings.map((warn, idx) => (
                  <div key={idx} className="text-[8px] leading-relaxed text-yellow-500/90">
                    ⚠️ {warn}
                  </div>
                ))}
                {liveContext.governance.critical.map((crit, idx) => (
                  <div key={idx} className="text-[8px] leading-relaxed text-red-400 font-bold">
                    🛑 {crit}
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic Action Buttons in Sidebar */}
            <div className="space-y-2 pt-2 border-t border-[#1a1a1a]">
              
              <button
                onClick={() => {
                  selectStrategy('strat_101');
                  setWorkspace('explorer');
                }}
                className="w-full bg-[#111] hover:bg-[#222] text-white border border-[#222] font-sans text-[10px] font-bold uppercase py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#c5a059]" />
                View in Strategy Explorer
              </button>

              <button
                onClick={() => {
                  setWorkspace('backtest_lab');
                }}
                className="w-full bg-[#111] hover:bg-[#222] text-white border border-[#222] font-sans text-[10px] font-bold uppercase py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-[#4F8EF7]" />
                Run Another Backtest
              </button>

              <button
                onClick={handlePromote}
                disabled={liveContext.status === 'halted' || isPromoted}
                className={`w-full font-sans text-[10px] font-bold uppercase py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  liveContext.status === 'halted'
                    ? 'bg-red-950/20 text-red-800 border border-red-950/40 cursor-not-allowed'
                    : isPromoted
                    ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/40 cursor-default'
                    : 'bg-[#f97316] hover:bg-[#d95d00] text-black border border-[#f97316] cursor-pointer'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                {isPromoted ? 'Promoted successfully' : 'Promote to Portfolio Layer'}
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Absolute Toast Panel */}
      {toastMessage && (
        <div className="absolute top-5 right-5 bg-black/95 text-[#c5a059] border border-[#c5a059]/40 p-4 rounded-xl shadow-2xl z-50 text-[11px] font-mono flex items-center gap-3 animate-slideIn">
          <Sparkles className="w-4 h-4 text-[#c5a059] animate-pulse" />
          <div>{toastMessage}</div>
        </div>
      )}

    </div>
  );
};
