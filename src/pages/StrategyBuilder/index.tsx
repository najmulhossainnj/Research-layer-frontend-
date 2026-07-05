import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  Edge,
  NodeChange,
  EdgeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { QuantNode } from '../../components/pipeline/QuantNode';
import { DataSourceConfig } from '../../components/pipeline/DataSourceConfig';
import { useUIStore } from '../../store/useUIStore';
import Button from '@mui/material/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStrategy, updateStrategy, getStrategies, createStrategy } from '../../api/client';
import { PipelineConfig, PipelineNode, PipelineEdge, Strategy } from '../../types';

const INITIAL_NODES = [
  { id: 'src_1', type: 'quantNode', position: { x: 50, y: 180 }, data: { type: 'data_source', label: 'Tech MegaCaps (1d)', config: { symbols: ['AAPL', 'NVDA', 'MSFT'], timeframe: '1d' } } },
  { id: 'feat_1', type: 'quantNode', position: { x: 320, y: 180 }, data: { type: 'feature', label: 'RSI & Vol Breakout', config: { plugin: 'rsi_breakout', period: 14 } } },
  { id: 'sel_1', type: 'quantNode', position: { x: 590, y: 180 }, data: { type: 'feature_selector', label: 'SHAP Pruning', config: { method: 'SHAP', threshold: 0.05 } } },
  { id: 'mod_1', type: 'quantNode', position: { x: 860, y: 180 }, data: { type: 'model', label: 'LightGBM Regressor', config: { plugin: 'lightgbm_quant', trees: 250 } } },
  { id: 'sig_1', type: 'quantNode', position: { x: 1130, y: 180 }, data: { type: 'signal_logic', label: 'Z-Score Gate Rule', config: { thresh: 1.5 } } },
  { id: 'bt_1', type: 'quantNode', position: { x: 1400, y: 180 }, data: { type: 'backtest', label: 'vectorbt Engine', config: { capital: '$1,000,000' } } }
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e1', source: 'src_1', target: 'feat_1', animated: true, style: { stroke: '#2ECC8F', strokeWidth: 2, strokeDasharray: '5,5' } },
  { id: 'e2', source: 'feat_1', target: 'sel_1', animated: true, style: { stroke: '#2ECC8F', strokeWidth: 2, strokeDasharray: '5,5' } },
  { id: 'e3', source: 'sel_1', target: 'mod_1', animated: true, style: { stroke: '#2ECC8F', strokeWidth: 2, strokeDasharray: '5,5' } },
  { id: 'e4', source: 'mod_1', target: 'sig_1', animated: true, style: { stroke: '#2ECC8F', strokeWidth: 2, strokeDasharray: '5,5' } },
  { id: 'e5', source: 'sig_1', target: 'bt_1', animated: true, style: { stroke: '#2ECC8F', strokeWidth: 2, strokeDasharray: '5,5' } }
];

export const StrategyBuilder: React.FC = () => {
  const { selectedStrategyId, selectStrategy } = useUIStore();
  const [nodes, setNodes] = useState<any[]>(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // New Strategy/Pipeline Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newUniverse, setNewUniverse] = useState('AAPL, NVDA, MSFT');
  const [newTimeframe, setNewTimeframe] = useState('1d');

  const createStrategyMut = useMutation({
    mutationFn: createStrategy,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      setToast(`PIPELINE_CREATED // Strategy pipeline [${data.name}] successfully deployed to database.`);
      setShowCreateModal(false);
      selectStrategy(data.id);
      setTimeout(() => setToast(null), 4000);
    },
    onError: (err: any) => {
      setToast(`CREATE_FAILED // ${err.message || 'An error occurred'}`);
      setTimeout(() => setToast(null), 5000);
    }
  });

  const handleCreateStrategy = () => {
    if (!newName.trim()) {
      setToast('VALIDATION_ERROR // Name is required');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const pipelineNodes: PipelineNode[] = nodes.map((n) => ({
      id: n.id,
      type: n.data.type,
      label: n.data.label,
      position: n.position || { x: 0, y: 0 },
      config: n.data.config || {},
    }));

    const pipelineEdges: PipelineEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.animated
    }));

    const pipeline_config: PipelineConfig = {
      nodes: pipelineNodes,
      edges: pipelineEdges
    };

    createStrategyMut.mutate({
      name: newName,
      description: newDesc,
      universe: newUniverse.split(',').map((s) => s.trim()).filter(Boolean),
      timeframe: newTimeframe,
      pipeline_config
    });
  };

  const { data: strategies = [] } = useQuery<Strategy[]>({
    queryKey: ['strategies'],
    queryFn: getStrategies
  });

  const activeStrategyId = selectedStrategyId || (strategies.length > 0 ? strategies[0].id : 'strat_101');

  const { data: strategy } = useQuery({
    queryKey: ['strategy', activeStrategyId],
    queryFn: () => getStrategy(activeStrategyId),
    enabled: !!activeStrategyId && activeStrategyId !== 'strat_101',
  });

  useEffect(() => {
    if (strategy?.pipeline_config) {
      const config = strategy.pipeline_config;
      if (config.nodes && config.nodes.length > 0) {
        const flowNodes = config.nodes.map((n) => ({
          id: n.id,
          type: 'quantNode',
          position: n.position || { x: 50, y: 180 },
          data: {
            type: n.type,
            label: n.label,
            config: n.config || {}
          }
        }));
        setNodes(flowNodes);
      } else {
        setNodes(INITIAL_NODES);
      }
      if (config.edges && config.edges.length > 0) {
        setEdges(config.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          animated: e.animated ?? true,
          style: { stroke: '#2ECC8F', strokeWidth: 2, strokeDasharray: '5,5' }
        })));
      } else {
        setEdges(INITIAL_EDGES);
      }
    } else {
      setNodes(INITIAL_NODES);
      setEdges(INITIAL_EDGES);
    }
  }, [strategy]);

  const saveMutation = useMutation({
    mutationFn: (pipeline: PipelineConfig) =>
      updateStrategy(activeStrategyId, { pipeline_config: pipeline }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', activeStrategyId] });
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      setToast(`PIPELINE_SAVED // Successfully serialized ${nodes.length} nodes & ${edges.length} edges to Strategy [${activeStrategyId}]`);
      setTimeout(() => setToast(null), 4000);
    },
    onError: (err: any) => {
      setToast(`SAVE_ERROR // Failed to save pipeline: ${err.message}`);
      setTimeout(() => setToast(null), 4000);
    }
  });

  const nodeTypes = useMemo(() => ({ quantNode: QuantNode }), []);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onConnect = useCallback((connection: Connection) => {
    // Validate edge sequencing rule
    const srcNode = nodes.find((n) => n.id === connection.source);
    const tgtNode = nodes.find((n) => n.id === connection.target);

    let isValid = true;
    if (srcNode && tgtNode) {
      const sType = srcNode.data.type;
      const tType = tgtNode.data.type;
      if (sType === 'backtest' || tType === 'data_source') isValid = false;
    }

    const newEdge: Edge = {
      ...connection,
      id: `edge_${Date.now()}`,
      animated: isValid,
      style: {
        stroke: isValid ? '#2ECC8F' : '#E05252',
        strokeWidth: 2,
        strokeDasharray: '5,5'
      }
    } as Edge;

    setEdges((eds) => addEdge(newEdge, eds));
    if (!isValid) {
      setToast('INVALID_EDGE // Connection breaks quant pipeline topology constraints.');
      setTimeout(() => setToast(null), 3000);
    }
  }, [nodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNodeId(node.id);
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const addPaletteNode = (type: string, label: string) => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      type: 'quantNode',
      position: { x: 100 + (nodes.length % 4) * 50, y: 100 + (nodes.length % 3) * 60 },
      data: { type, label, config: { created: new Date().toLocaleTimeString() } }
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
  };

  const handleSavePipeline = () => {
    if (activeStrategyId === 'strat_101') {
      setNewName('');
      setNewDesc('');
      setShowCreateModal(true);
      return;
    }

    const pipelineNodes: PipelineNode[] = nodes.map((n) => ({
      id: n.id,
      type: n.data.type,
      label: n.data.label,
      position: n.position || { x: 0, y: 0 },
      config: n.data.config || {},
    }));

    const pipelineEdges: PipelineEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.animated
    }));

    saveMutation.mutate({
      nodes: pipelineNodes,
      edges: pipelineEdges
    });
  };

  const updateSelectedNodeConfig = (key: string, val: any) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return { ...n, data: { ...n.data, config: { ...n.data.config, [key]: val } } };
        }
        return n;
      })
    );
  };

  const paletteList = [
    { type: 'data_source', label: 'Data Source', icon: 'database', color: 'text-[#4F8EF7]' },
    { type: 'feature', label: 'Feature Eng', icon: 'functions', color: 'text-[#a855f7]' },
    { type: 'feature_selector', label: 'Feature Selector', icon: 'filter_alt', color: 'text-[#14b8a6]' },
    { type: 'model', label: 'ML Model', icon: 'psychology', color: 'text-[#f97316]' },
    { type: 'signal_logic', label: 'Signal Rules', icon: 'sensors', color: 'text-[#eab308]' },
    { type: 'backtest', label: 'Backtest Engine', icon: 'stacked_line_chart', color: 'text-[#2ECC8F]' }
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-[#050505] relative select-none">
      {/* Toast */}
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#141720] border border-[#c5a059] text-white px-4 py-2 rounded font-mono text-xs shadow-2xl">
          {toast}
        </div>
      )}

      {/* Node Palette Sidebar */}
      <div className="w-56 bg-[#080808] border-r border-[#1a1a1a] p-4 flex flex-col shrink-0 z-10">
        <div className="mb-4 pb-3 border-b border-[#1a1a1a]">
          <div className="flex justify-between items-center mb-1.5">
            <div className="text-[10px] uppercase font-bold text-[#2ECC8F] font-sans">
              Active Strategy
            </div>
            <button
              onClick={() => {
                setNewName('');
                setNewDesc('');
                setShowCreateModal(true);
              }}
              className="text-[10px] font-mono text-[#eab308] hover:text-[#ffd659] bg-transparent border-none cursor-pointer p-0 uppercase font-bold"
            >
              + Create
            </button>
          </div>
          <select
            value={activeStrategyId}
            onChange={(e) => selectStrategy(e.target.value)}
            className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2 outline-none focus:border-[#2ECC8F] cursor-pointer"
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value="strat_101">Default (Demo Canvas)</option>
          </select>
        </div>

        <div className="text-[10px] uppercase font-bold text-[#6A7488] font-sans mb-3">
          Node Palette
        </div>
        <div className="space-y-2 flex-1">
          {paletteList.map((item) => (
            <div
              key={item.type}
              onClick={() => addPaletteNode(item.type, item.label)}
              className="bg-[#141414] hover:bg-[#1c2030] border border-[#252A3A] p-2.5 rounded cursor-pointer flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[18px] ${item.color}`}>{item.icon}</span>
                <span className="text-xs font-sans font-medium text-[#d4d4d4] group-hover:text-white">{item.label}</span>
              </div>
              <span className="text-[10px] font-mono text-[#6A7488]">+</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#1a1a1a] space-y-2">
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSavePipeline}
            className="font-sans text-[11px] font-bold uppercase tracking-widest py-2"
          >
            Save Pipeline
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => { setNodes(INITIAL_NODES); setEdges(INITIAL_EDGES); setSelectedNodeId(null); }}
            className="font-sans text-[10px] font-bold uppercase tracking-widest py-1.5 text-[#8B95A8] border-[#252A3A]"
          >
            Reset Canvas
          </Button>
        </div>
      </div>

      {/* React Flow Visual Canvas */}
      <div className="flex-1 h-full bg-[#050505]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="#1a1a1a" gap={20} size={1} />
          <Controls className="!bg-[#141414] !border-[#252A3A] !fill-white !text-white" />
        </ReactFlow>
      </div>

      {/* Right Config Drawer */}
      {selectedNode && (
        <div className="w-80 bg-[#0a0a0a] border-l border-[#1a1a1a] p-5 flex flex-col shrink-0 z-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#1a1a1a]">
            <div>
              <span className="text-[10px] font-mono text-[#c5a059] block uppercase">{selectedNode.data.type}</span>
              <h3 className="text-sm font-sans font-bold text-white uppercase m-0">{selectedNode.data.label}</h3>
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="border-none bg-transparent text-[#6A7488] hover:text-white cursor-pointer text-lg"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1 font-sans">Node Label</label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => setNodes((nds) => nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
                className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2 outline-none focus:border-[#c5a059]"
              />
            </div>

             <div className="text-[10px] uppercase font-bold text-[#c5a059] font-sans pt-2 border-t border-[#1a1a1a]">
              Parameters Config
            </div>

            {selectedNode.data.type === 'data_source' ? (
              <DataSourceConfig 
                config={selectedNode.data.config || {}}
                onChange={updateSelectedNodeConfig}
              />
            ) : (
              selectedNode.data.config && Object.entries(selectedNode.data.config).map(([k, v]) => (
                <div key={k}>
                  <label className="text-[10px] font-mono text-[#8B95A8] block mb-1 uppercase">{k}</label>
                  <input
                    type="text"
                    value={Array.isArray(v) ? v.join(', ') : String(v)}
                    onChange={(e) => updateSelectedNodeConfig(k, e.target.value)}
                    className="w-full bg-[#141414] border border-[#252A3A] text-[#C5E0B4] font-mono text-xs rounded p-2 outline-none focus:border-[#4F8EF7]"
                  />
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-[#1a1a1a] mt-auto flex gap-2">
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => { setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId)); setSelectedNodeId(null); }}
              className="font-sans text-[10px] font-bold uppercase"
            >
              Delete Node
            </Button>
          </div>
        </div>
      )}

      {/* Create New Pipeline/Strategy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0d14] border border-[#252A3A] rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#1a1a1a] flex justify-between items-center bg-[#070707]">
              <div>
                <span className="text-[10px] font-mono text-[#eab308] block">STRATEGY REGISTRY ACTION</span>
                <h2 className="text-base font-sans font-bold text-white uppercase m-0">Register Strategy Pipeline</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-transparent border-none text-[#6A7488] hover:text-white cursor-pointer text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Strategy Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Volatility Mean Reversion"
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#eab308]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the logic flow and target market conditions..."
                  rows={2}
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#eab308] resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Assets Universe (Comma-separated)</label>
                <input
                  type="text"
                  value={newUniverse}
                  onChange={(e) => setNewUniverse(e.target.value)}
                  placeholder="e.g. AAPL, NVDA, MSFT"
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#eab308]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Base Timeframe</label>
                <select
                  value={newTimeframe}
                  onChange={(e) => setNewTimeframe(e.target.value)}
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#eab308]"
                >
                  <option value="1m">1 minute (1m)</option>
                  <option value="5m">5 minutes (5m)</option>
                  <option value="15m">15 minutes (15m)</option>
                  <option value="1h">1 hour (1h)</option>
                  <option value="1d">Daily (1d)</option>
                </select>
              </div>

              <div className="bg-[#141720]/50 border border-[#eab308]/20 p-3 rounded font-mono text-[10px] text-[#8B95A8] mt-2">
                <span className="text-[#eab308] font-bold">INFO:</span> Your active canvas layout of <b>{nodes.length} nodes</b> and <b>{edges.length} edges</b> will be pre-serialized directly into this new strategy pipeline.
              </div>
            </div>

            <div className="p-5 border-t border-[#1a1a1a] bg-[#070707] flex justify-end gap-3">
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowCreateModal(false)}
                className="text-white border-[#252A3A]"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleCreateStrategy}
                disabled={createStrategyMut.isPending}
                className="bg-[#eab308] text-black font-sans font-bold hover:bg-[#d9a307]"
              >
                {createStrategyMut.isPending ? 'Registering...' : 'Register Strategy'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
