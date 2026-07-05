import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSignals, saveSignalLogic, updateSignalLogic, generateSignalsPreview } from '../../api/client';
import { SignalLogic, RuleNode } from '../../types';
import Button from '@mui/material/Button';
import { SignalOverlayChart } from '../../components/charts/SignalOverlayChart';

export const SignalBuilder: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: signals = [], isLoading } = useQuery<SignalLogic[]>({
    queryKey: ['signals'],
    queryFn: getSignals
  });

  // State
  const [selectedId, setSelectedId] = useState<string>('');
  const [editingSig, setEditingSig] = useState<SignalLogic | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // New Signal Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newOutputMode, setNewOutputMode] = useState<'discrete' | 'numeric'>('discrete');
  const [newPositionMode, setNewPositionMode] = useState<'long_only' | 'long_short' | 'portfolio'>('long_short');

  // Load selected signal into editing state
  useEffect(() => {
    if (signals.length > 0) {
      const activeId = selectedId || signals[0].id;
      if (!selectedId) {
        setSelectedId(activeId);
      }
      const found = signals.find((s) => s.id === activeId);
      if (found) {
        // Deep clone the signal to avoid mutating cached query data
        setEditingSig(JSON.parse(JSON.stringify(found)));
      }
    }
  }, [signals, selectedId]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: saveSignalLogic,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      setSelectedId(data.id);
      setShowCreateModal(false);
      setToast(`SIGNAL_CREATED // Created signal logic rule [${data.name}]`);
      setTimeout(() => setToast(null), 4000);
      // Reset form
      setNewName('');
      setNewDesc('');
      setNewOutputMode('discrete');
      setNewPositionMode('long_short');
    },
    onError: (err: any) => {
      setToast(`CREATE_ERROR // Failed to create signal: ${err.message}`);
      setTimeout(() => setToast(null), 5000);
    }
  });

  const saveMutation = useMutation({
    mutationFn: (body: SignalLogic) => {
      const updatePayload = {
        name: body.name,
        description: body.description,
        rule_tree: body.rule_tree,
        output_mode: body.output_mode,
        position_mode: body.position_mode,
        strategy_id: body.strategy_id
      };
      return updateSignalLogic(body.id, updatePayload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      setToast(`SIGNAL_SAVED // Successfully persisted modifications for [${data.name}]`);
      setTimeout(() => setToast(null), 4000);
    },
    onError: (err: any) => {
      setToast(`SAVE_ERROR // Failed to save signal logic: ${err.message}`);
      setTimeout(() => setToast(null), 5000);
    }
  });

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);
      const res = await generateSignalsPreview();
      setPreviewData(res);
      setToast('SIMULATION_COMPLETE // Signal stream rendered below.');
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      setToast(`SIMULATION_FAILED // ${e.message}`);
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsSimulating(false);
    }
  };

  // AST Modifier Helpers
  const updateNodeInTree = (nodes: RuleNode[], nodeId: string, updates: Partial<RuleNode>): RuleNode[] => {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: updateNodeInTree(node.children, nodeId, updates) };
      }
      return node;
    });
  };

  const deleteNodeFromTree = (nodes: RuleNode[], nodeId: string): RuleNode[] => {
    return nodes
      .filter((node) => node.id !== nodeId)
      .map((node) => {
        if (node.children && node.children.length > 0) {
          return { ...node, children: deleteNodeFromTree(node.children, nodeId) };
        }
        return node;
      });
  };

  const addNodeToGroup = (nodes: RuleNode[], groupId: string, newNode: RuleNode): RuleNode[] => {
    return nodes.map((node) => {
      if (node.id === groupId) {
        return {
          ...node,
          children: [...(node.children || []), newNode]
        };
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: addNodeToGroup(node.children, groupId, newNode) };
      }
      return node;
    });
  };

  const updateRuleTree = (updatedTree: RuleNode[]) => {
    if (editingSig) {
      setEditingSig({
        ...editingSig,
        rule_tree: updatedTree
      });
    }
  };

  const handleAddCondition = (groupId: string) => {
    const newCondition: RuleNode = {
      id: `cond_${Date.now()}`,
      type: 'condition',
      field: 'model_pred_return',
      operator: '>=',
      value: 0.01
    };
    if (editingSig) {
      const updated = addNodeToGroup(editingSig.rule_tree, groupId, newCondition);
      updateRuleTree(updated);
    }
  };

  const handleAddGroup = (groupId: string) => {
    const newGroup: RuleNode = {
      id: `group_${Date.now()}`,
      type: 'group',
      combinator: 'OR',
      action: 'BUY',
      children: [
        {
          id: `cond_${Date.now()}_init`,
          type: 'condition',
          field: 'rsi_vol_norm',
          operator: '<',
          value: 70
        }
      ]
    };
    if (editingSig) {
      const updated = addNodeToGroup(editingSig.rule_tree, groupId, newGroup);
      updateRuleTree(updated);
    }
  };

  const handleUpdateNode = (nodeId: string, updates: Partial<RuleNode>) => {
    if (editingSig) {
      const updated = updateNodeInTree(editingSig.rule_tree, nodeId, updates);
      updateRuleTree(updated);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    if (editingSig) {
      const updated = deleteNodeFromTree(editingSig.rule_tree, nodeId);
      updateRuleTree(updated);
    }
  };

  const handleCreateSignal = () => {
    if (!newName.trim()) {
      setToast('VALIDATION_ERROR // Name is required');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const initialTree: RuleNode[] = [
      {
        id: 'root',
        type: 'group',
        action: 'BUY',
        combinator: 'AND',
        children: [
          {
            id: `cond_${Date.now()}`,
            type: 'condition',
            field: 'model_pred_return',
            operator: '>=',
            value: 0.01
          }
        ]
      }
    ];

    createMutation.mutate({
      name: newName,
      description: newDesc || 'Custom generated logic gate rule tree',
      output_mode: newOutputMode,
      position_mode: newPositionMode,
      rule_tree: initialTree,
    } as any);
  };

  const handleSaveActiveSignal = () => {
    if (editingSig) {
      saveMutation.mutate(editingSig);
    }
  };

  // Render Recursive Node
  const renderRuleNode = (node: RuleNode, depth = 0) => {
    if (node.type === 'group') {
      return (
        <div
          key={node.id}
          className={`p-4 rounded-lg bg-[#0a0a0a] border border-[#252A3A] my-3 select-none transition-all ${
            depth > 0 ? 'ml-6 border-l-4 border-l-[#eab308]' : 'border-l-4 border-l-[#2ECC8F]'
          }`}
        >
          <div className="flex flex-wrap justify-between items-center gap-3 mb-3 pb-2 border-b border-[#141414]">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#6A7488]">TRIGGER MODE:</span>
              <select
                value={node.action || 'BUY'}
                onChange={(e) => handleUpdateNode(node.id, { action: e.target.value as any })}
                className="bg-[#141414] border border-[#252A3A] text-white font-mono text-xs px-2 py-1 rounded outline-none focus:border-[#2ECC8F]"
              >
                <option value="BUY">BUY (Long)</option>
                <option value="SELL">SELL (Short)</option>
                <option value="HOLD">HOLD (Pass)</option>
              </select>
              <span className="text-[#8B95A8] ml-2">WHEN</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={node.combinator || 'AND'}
                onChange={(e) => handleUpdateNode(node.id, { combinator: e.target.value as any })}
                className="bg-[#141414] border border-[#333] text-[#c5a059] font-mono text-xs px-2 py-1 rounded outline-none focus:border-[#c5a059]"
              >
                <option value="AND">ALL CONDITIONS (AND)</option>
                <option value="OR">ANY CONDITION (OR)</option>
              </select>

              {depth > 0 && (
                <button
                  onClick={() => handleDeleteNode(node.id)}
                  className="bg-red-950/40 text-[#E05252] border border-[#E05252]/20 hover:bg-red-900/60 transition-colors px-2 py-1 rounded font-mono text-[10px] cursor-pointer"
                >
                  DELETE GROUP
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {node.children && node.children.length > 0 ? (
              node.children.map((c) => renderRuleNode(c, depth + 1))
            ) : (
              <p className="text-[10px] font-mono text-[#6A7488] italic m-0 p-2 text-center bg-[#111] rounded">
                No active rules in this logic gate group.
              </p>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-[#1a1a1a] flex gap-2">
            <Button
              size="small"
              onClick={() => handleAddCondition(node.id)}
              className="text-[10px] font-mono uppercase text-[#4F8EF7] border-[#252A3A] hover:bg-[#4F8EF7]/10"
              style={{ padding: '2px 8px', border: '1px solid #252A3A' }}
            >
              + Add Condition
            </Button>
            <Button
              size="small"
              onClick={() => handleAddGroup(node.id)}
              className="text-[10px] font-mono uppercase text-[#eab308] border-[#252A3A] hover:bg-[#eab308]/10"
              style={{ padding: '2px 8px', border: '1px solid #252A3A' }}
            >
              + Add Group
            </Button>
          </div>
        </div>
      );
    }

    // Condition Node Rendering with Selectors
    return (
      <div key={node.id} className="bg-[#141414] border border-[#222] p-2 rounded flex flex-wrap items-center justify-between gap-3 font-mono text-xs ml-4 transition-all hover:border-[#333]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Field select */}
          <select
            value={node.field || 'model_pred_return'}
            onChange={(e) => handleUpdateNode(node.id, { field: e.target.value })}
            className="bg-[#0c0d14] border border-[#252A3A] text-[#4F8EF7] font-mono text-xs px-1.5 py-0.5 rounded outline-none focus:border-[#4F8EF7]"
          >
            <option value="model_pred_return">model_pred_return</option>
            <option value="rsi_vol_norm">rsi_vol_norm</option>
            <option value="macd_diff">macd_diff</option>
            <option value="sma_cross">sma_cross</option>
            <option value="bollinger_w">bollinger_w</option>
            <option value="shap_pruned_score">shap_pruned_score</option>
          </select>

          {/* Operator select */}
          <select
            value={node.operator || '>='}
            onChange={(e) => handleUpdateNode(node.id, { operator: e.target.value as any })}
            className="bg-[#0c0d14] border border-[#252A3A] text-[#c5a059] font-mono text-xs px-1.5 py-0.5 rounded outline-none focus:border-[#c5a059]"
          >
            <option value=">=">&gt;=</option>
            <option value="<=">&lt;=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value="==">==</option>
            <option value="!=">!=</option>
          </select>

          {/* Value Input */}
          <input
            type="number"
            step="0.001"
            value={node.value !== undefined ? node.value : 0}
            onChange={(e) => handleUpdateNode(node.id, { value: parseFloat(e.target.value) || 0 })}
            className="bg-[#0c0d14] border border-[#252A3A] text-[#2ECC8F] font-mono text-xs px-1.5 py-0.5 rounded w-20 outline-none focus:border-[#2ECC8F]"
          />
        </div>

        <button
          onClick={() => handleDeleteNode(node.id)}
          className="border-none bg-transparent text-[#6A7488] hover:text-[#E05252] cursor-pointer text-sm p-1 font-bold"
          title="Remove condition"
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#050505]">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#141720] border border-[#2ECC8F] text-white px-4 py-2.5 rounded font-mono text-xs shadow-2xl">
          {toast}
        </div>
      )}

      {/* Left Signal Bank */}
      <div className="w-full md:w-72 bg-[#080808] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex flex-col shrink-0 max-h-[40vh] md:max-h-none overflow-y-auto">
        <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center bg-[#070707] shrink-0">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#6A7488] font-mono block">QUANT RULES</span>
            <span className="text-xs uppercase font-bold text-white font-sans tracking-wider">Signal Logic Bank</span>
          </div>
          <Button
            variant="contained"
            size="small"
            onClick={() => setShowCreateModal(true)}
            className="bg-[#eab308] text-black text-[10px] font-sans font-bold hover:bg-[#d9a307]"
            style={{ minWidth: 'auto', padding: '4px 10px' }}
          >
            + Create
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-xs font-mono text-[#6A7488]">
              LOADING_SIGNALS_CATALOG...
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-8 text-xs font-mono text-[#6A7488]">
              NO_SIGNALS_FOUND
            </div>
          ) : (
            signals.map((s) => {
              if (!s) return null;
              const active = s.id === selectedId;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`p-3 rounded border border-transparent transition-all cursor-pointer select-none ${
                    active
                      ? 'bg-[#141720] border-[#eab308]/40 text-white shadow-md'
                      : 'text-[#8B95A8] hover:bg-[#11131a] hover:text-white'
                  }`}
                >
                  <div className="text-xs font-sans font-bold truncate flex items-center justify-between">
                    <span>{s.name || 'Unnamed Signal'}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]"></span>}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[9px] font-mono text-[#6A7488]">
                    <span>MODE: {s.output_mode || 'discrete'}</span>
                    <span className="text-[#eab308] uppercase">{s.position_mode?.replace('_', ' ') || 'long short'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Tree Editor & Simulator */}
      <div className="flex-1 flex flex-col bg-[#050505] overflow-y-auto p-6 space-y-6">
        {editingSig ? (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1a1a1a] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#eab308] bg-[#eab308]/10 px-2 py-0.5 rounded font-bold">
                    SIGNAL SPEC
                  </span>
                  <span className="text-[10px] font-mono text-[#6A7488]">ID: {editingSig.id}</span>
                </div>
                <h1 className="text-2xl font-light text-white font-sans mt-2 mb-1">{editingSig.name}</h1>
                <p className="text-xs font-sans text-[#8B95A8] m-0 max-w-xl">{editingSig.description || 'No description provided.'}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outlined"
                  onClick={handleSaveActiveSignal}
                  disabled={saveMutation.isPending}
                  className="text-xs font-sans font-bold text-[#eab308] border-[#eab308] hover:bg-[#eab308]/10 px-4"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Rule Tree'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="bg-[#4F8EF7] text-white font-sans font-bold tracking-wider px-4 hover:bg-[#3679df]"
                >
                  {isSimulating ? 'Simulating...' : 'Simulate Signal Stream'}
                </Button>
              </div>
            </div>

            {/* Quick configuration settings for active signal */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-lg pb-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Signal Name</label>
                  <input
                    type="text"
                    value={editingSig.name}
                    onChange={(e) => setEditingSig({ ...editingSig, name: e.target.value })}
                    className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2 outline-none focus:border-[#eab308]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Output Mode</label>
                  <select
                    value={editingSig.output_mode}
                    onChange={(e) => setEditingSig({ ...editingSig, output_mode: e.target.value as any })}
                    className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2 outline-none focus:border-[#eab308]"
                  >
                    <option value="discrete">discrete</option>
                    <option value="numeric">numeric (continuous)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Position Mode</label>
                  <select
                    value={editingSig.position_mode}
                    onChange={(e) => setEditingSig({ ...editingSig, position_mode: e.target.value as any })}
                    className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2 outline-none focus:border-[#eab308]"
                  >
                    <option value="long_only">long_only</option>
                    <option value="long_short">long_short</option>
                    <option value="portfolio">portfolio</option>
                  </select>
                </div>
              </div>
              <div className="bg-[#141720]/40 border border-[#2ECC8F]/10 px-3 py-1.5 rounded flex justify-between items-center font-mono text-[10px] text-[#8B95A8]">
                <span>BACKEND_PROCESSING_PLUGIN:</span>
                <span className="text-[#2ECC8F] font-bold">
                  {editingSig.position_mode === 'long_short' ? 'signal.long_short' : editingSig.position_mode === 'portfolio' ? 'signal.portfolio' : 'signal.threshold'}
                </span>
              </div>
            </div>

            {/* Rule Tree Canvas */}
            <div>
              <span className="text-xs font-mono text-[#c5a059] block mb-2 uppercase">Hierarchical AST Rule Combinator</span>
              {editingSig.rule_tree && editingSig.rule_tree.length > 0 ? (
                editingSig.rule_tree.map((node) => renderRuleNode(node))
              ) : (
                <div className="bg-[#0a0a0a] border border-dashed border-[#252A3A] p-8 rounded-lg text-center font-mono text-xs text-[#6A7488]">
                  EMPTY_RULE_TREE // Click below to initialize a root trigger group
                  <div className="mt-3">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setEditingSig({
                        ...editingSig,
                        rule_tree: [{ id: 'root', type: 'group', combinator: 'AND', action: 'BUY', children: [] }]
                      })}
                      className="bg-[#2ECC8F] text-black font-mono font-bold text-[10px]"
                    >
                      + Create Root Group
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Simulation Output Table */}
            {previewData && (
              <div className="space-y-4 animate-fadeIn">
                <SignalOverlayChart previewData={previewData} />

                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-lg space-y-4">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="text-[#2ECC8F] font-bold">✓ PREVIEW STREAM // {previewData.total_bars ?? 500} BARS SIMULATED</span>
                    <span>TRIGGER RATE: <b className="text-[#c5a059]">{previewData.signal_rate ?? '4.2%'}</b></span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 font-mono text-center text-xs">
                    <div className="bg-[#141414] p-2.5 rounded text-[#2ECC8F]">BUY TRIGGERS: {previewData.counts?.BUY ?? 12}</div>
                    <div className="bg-[#141414] p-2.5 rounded text-[#E05252]">SELL TRIGGERS: {previewData.counts?.SELL ?? 9}</div>
                    <div className="bg-[#141414] p-2.5 rounded text-[#888]">HOLD/PASS: {previewData.counts?.HOLD ?? 479}</div>
                  </div>

                  <div className="overflow-x-auto border border-[#1a1a1a] rounded max-h-60 overflow-y-auto font-mono text-xs">
                    <table className="w-full text-left border-collapse bg-[#0a0a0a]">
                      <thead>
                        <tr className="bg-[#141414] text-[#8B95A8] text-[10px] uppercase sticky top-0 border-b border-[#222]">
                          <th className="p-2">Timestamp</th>
                          <th className="p-2">Conviction Pred</th>
                          <th className="p-2">Trigger Signal</th>
                          <th className="p-2">Ref Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1a1a]">
                        {(previewData.preview || []).map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#111]">
                            <td className="p-2 text-[#888]">{r.date || r.timestamp || 'N/A'}</td>
                            <td className="p-2 text-white">{r.prediction !== undefined ? r.prediction : '0.00'}</td>
                            <td className="p-2 font-bold">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                r.signal === 'BUY'
                                  ? 'bg-[#2ECC8F]/15 text-[#2ECC8F]'
                                  : r.signal === 'SELL'
                                  ? 'bg-[#E05252]/15 text-[#E05252]'
                                  : 'text-[#666]'
                              }`}>
                                {r.signal}
                              </span>
                            </td>
                            <td className="p-2 text-[#c5a059]">${r.price !== undefined ? r.price.toFixed(2) : '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs font-mono text-[#6A7488]">
            {isLoading ? 'LOADING_ACTIVE_SIGNAL_METADATA...' : 'SELECT_OR_CREATE_SIGNAL_SPEC_TO_BEGIN'}
          </div>
        )}
      </div>

      {/* Create New Signal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0d14] border border-[#252A3A] rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#1a1a1a] flex justify-between items-center bg-[#070707]">
              <div>
                <span className="text-[10px] font-mono text-[#eab308] block">RULE REGISTRY ACTION</span>
                <h2 className="text-base font-sans font-bold text-white uppercase m-0">Create Signal Rule Gate</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-transparent border-none text-[#6A7488] hover:text-white cursor-pointer text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Rule Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Z-Score Momentum Gate"
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#eab308]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the condition matching logic and parameters..."
                  rows={2}
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#eab308] resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Output Mode</label>
                <select
                  value={newOutputMode}
                  onChange={(e) => setNewOutputMode(e.target.value as any)}
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#eab308]"
                >
                  <option value="discrete">discrete</option>
                  <option value="numeric">numeric (continuous)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#6A7488] block mb-1">Position Mode</label>
                <select
                  value={newPositionMode}
                  onChange={(e) => setNewPositionMode(e.target.value as any)}
                  className="w-full bg-[#141414] border border-[#252A3A] text-white font-sans text-xs rounded p-2.5 outline-none focus:border-[#eab308]"
                >
                  <option value="long_only">long_only</option>
                  <option value="long_short">long_short</option>
                  <option value="portfolio">portfolio</option>
                </select>
              </div>

              <div className="bg-[#141720]/40 border border-[#2ECC8F]/10 px-3 py-1.5 rounded flex justify-between items-center font-mono text-[9px] text-[#8B95A8]">
                <span>BACKEND PLUGINS MAP:</span>
                <span className="text-[#2ECC8F] font-bold">
                  {newPositionMode === 'long_short' ? 'signal.long_short' : newPositionMode === 'portfolio' ? 'signal.portfolio' : 'signal.threshold'}
                </span>
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
                onClick={handleCreateSignal}
                disabled={createMutation.isPending}
                className="bg-[#eab308] text-black font-sans font-bold hover:bg-[#d9a307]"
              >
                {createMutation.isPending ? 'Registering...' : 'Register Rule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
