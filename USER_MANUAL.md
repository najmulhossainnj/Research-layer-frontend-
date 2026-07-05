# BLACKWOOD CAPITAL QUANT v5.0 - User Manual

## Table of Contents
1. [Overview](#overview)
2. [Navigation & Interface](#navigation--interface)
3. [Strategy Explorer](#strategy-explorer)
4. [Pipeline Builder (Strategy Builder)](#pipeline-builder-strategy-builder)
5. [Feature Builder](#feature-builder)
6. [Model Builder](#model-builder)
7. [Signal Builder](#signal-builder)
8. [Backtest Lab](#backtest-lab)
9. [Experiment Tracker](#experiment-tracker)
10. [Validation Center](#validation-center)
11. [AI Researcher (Agentic Pipeline)](#ai-researcher-agentic-pipeline)
12. [Troubleshooting](#troubleshooting)

---

## Overview

**BLACKWOOD CAPITAL QUANT v5.0** is an institutional-grade quantitative research platform for systematic trading strategy development. The application provides a complete workflow from data ingestion through feature engineering, model training, backtesting, validation, and production deployment.

### Key Features
- **End-to-End Strategy Development**: From feature creation to production-ready strategies
- **AI-Powered Research**: Multi-agent system for automated strategy discovery
- **Institutional Validation**: Walk-forward analysis, Combinatorial Purged CV (CPCV), and overfitting metrics
- **Real-Time Execution**: Celery-based async task processing with live monitoring
- **Dark Terminal Aesthetic**: Professional trading terminal interface

### System Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                      BLACKWOOD CAPITAL QUANT                     │
├──────────────┬──────────────────────────────────────────────────┤
│   SIDEBAR    │                   MAIN CONTENT                   │
│              │                                                  │
│  Navigation  │  [Active Workspace - Strategy/Feature/Model/etc] │
│  + Active    │                                                  │
│    Universe  │                                                  │
│  + Celery    │                                                  │
│    Queue     │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## Navigation & Interface

### Global Header
Located at the top of the application with:
- **Brand Logo**: BLACKWOOD CAPITAL with QUANT v5.0 badge
- **Main Navigation Tabs**: Intelligence, Alpha Terminal, Feature Lab, Backtest, AI Agent
- **Market Data**: Real-time indices (S&P 500, US10Y, NVDA.O)
- **London Time**: Live clock synchronized to Europe/London timezone
- **Conviction Score**: Quantified confidence metric for current strategy

### Sidebar Navigation
The collapsible sidebar provides access to all modules:
| Icon | Module | Badge | Purpose |
|------|--------|-------|---------|
| explore | Strategy Explorer | - | Browse and manage strategies |
| account_tree | Pipeline Builder | FLOW | Visual strategy pipeline editor |
| dataset | Feature Builder | - | Feature creation and management |
| psychology | Model Builder | - | ML model training and tuning |
| sensors | Signal Builder | - | Trading signal rule configuration |
| stacked_line_chart | Backtest Lab | - | Strategy backtesting engine |
| science | Experiment Tracker | - | MLflow experiment comparison |
| verified | Validation Center | GATE | Walk-forward & CPCV validation |
| smart_toy | AI Researcher | GEMINI | Agentic research automation |

### Sidebar Sections
1. **Research Layer**: Primary navigation to all modules
2. **Active Universe**: Currently selected assets (NVDA.O, AAPL.O, TSLA.O)
3. **Celery Queue**: Async task monitoring (Walk-Forward, Feature Gen, etc.)
4. **User Session**: Team members and compute node info

---

## Strategy Explorer

### Purpose
Central hub for browsing, creating, and managing trading strategies.

### Features

#### Strategy Catalog (Left Panel)
- **Search**: Filter by name or universe (e.g., "AAPL")
- **Status Filters**: All, Validated, Promoted, Backtested, Draft, Archived
- **Strategy Cards**: Display name, status badge, metrics sparkline, last update

#### Strategy Details (Right Panel)
Click any strategy to view:
- **Metrics Dashboard**: Sharpe Ratio, CAGR, Max Drawdown, Win Rate, VaR, CVaR
- **Equity Curve Chart**: Historical performance visualization
- **Tabs**:
  - Overview: Summary metrics and JSON configuration
  - Backtests: Historical backtest results
  - Experiments: MLflow experiment runs
  - Validation: Walk-forward and CPCV results

#### Create New Strategy Modal
Click **+ Create** to open the strategy creation form:
1. **Name**: Strategy identifier (required)
2. **Description**: Optional strategy notes
3. **Universe**: Comma-separated asset symbols (e.g., "AAPL, NVDA, MSFT")
4. **Timeframe**: Data frequency (1d, 4h, 1h, 15m, 5m)
5. **Features**: Select from registered features or enter custom UUIDs
6. **Model**: Select or enter model ID
7. **Signal Logic**: Select or enter signal ID
8. Click **Deploy Strategy** to save

### Actions
- **Promote**: Move validated strategy to production layer
- **Delete**: Archive or remove strategy
- **Edit**: Modify strategy configuration

---

## Pipeline Builder (Strategy Builder)

### Purpose
Visual drag-and-drop interface for building strategy execution pipelines.

### Canvas Interface
The main canvas shows a flow graph with nodes connected by edges:

#### Default Pipeline Template
```
[Data Source] → [Features] → [Feature Selector] → [Model] → [Signal Logic] → [Backtest]
   Tech MegaCaps    RSI & Vol     SHAP Pruning    LightGBM    Z-Score Gate    vectorbt
   (1d)            Breakout         (0.05)         Regressor     (1.5)         Engine
```

### Node Types
| Node Type | Description | Config Options |
|-----------|-------------|----------------|
| data_source | Asset universe | symbols[], timeframe |
| feature | Feature engineering | plugin, period |
| feature_selector | Feature pruning | method, threshold |
| model | ML prediction model | plugin, trees |
| signal_logic | Trading signals | thresh, rules |
| backtest | Execution engine | capital, engine |

### Interactions
- **Add Node**: Right-click canvas or use toolbar
- **Connect Nodes**: Drag from source handle to target handle
- **Delete Node**: Select node → Delete Node button
- **Edit Node**: Select node → Right config panel updates
- **Save Pipeline**: Click **Save** to persist changes

### Creating a New Strategy
1. Build/modify your pipeline on canvas
2. Click **+ Create Pipeline**
3. Enter name, description, universe, timeframe
4. Click **Register Strategy**

---

## Feature Builder

### Purpose
Create and manage quantitative features derived from market data.

### Feature Bank (Left Panel)
Features organized by type:
- **Technical**: RSI, ATR, Moving Averages
- **Statistical**: Z-Score, Volatility Regime, Momentum
- **Automated**: tsfresh automated feature extraction
- **News**: Sentiment-based features

### Feature Operations

#### Create New Feature
1. Click **+ New**
2. Select backend plugin (e.g., `technical.rsi`)
3. Auto-detected feature name and type
4. Adjust lookback period (2-100 bars)
5. Click **Save Spec**

#### Feature Detail Tabs

**Versions Tab**
- View feature generation history
- Columns: Hash, Symbol, Timeframe, Rows, Columns, Created

**Generate Tab**
- Configure dataset execution:
  - Target Symbol (e.g., AAPL)
  - Timeframe (1d, 1h, 15m, 5m)
  - Start/End Date
- **Data Preview**: Live market data validation
- Click **Generate Feature Lake** to run

**Preview Tab**
- Parquet table preview (top 5 rows)
- Columns: Date, OHLC, RSI_Norm

### Available Plugins
| Plugin | Description |
|--------|-------------|
| technical.rsi | Relative Strength Index |
| technical.atr | Average True Range |
| statistical.z_score | Z-Score normalization |
| statistical.volatility_regime | Market regime detection |
| statistical.momentum | Momentum indicators |
| news.sentiment_momentum | News sentiment features |
| automated.tsfresh | Automated feature extraction |

---

## Model Builder

### Purpose
Train and optimize machine learning models for price prediction.

### Model Catalog (Left Panel)
- List of registered models
- Display: Name, Type, CV Score
- Select to view/edit

### Create New Model
1. Click **+ New Model**
2. Configure:

#### [01] Model Spec
- **Model Name**: Identifier
- **Plugin**: Select from available (XGBoost, LightGBM, CatBoost, Random Forest, LSTM)
- **Hyperparameters**: Dynamically loaded from search space

#### [02] Training Data & CV Engine
- **Asset Symbol**: Target ticker
- **Timeframe**: Data frequency
- **Date Range**: Start/End dates
- **Target Horizon**: Prediction lookahead (bars)
- **Features Matrix**: Multi-select from registered features
- **Cross Validation**:
  - Method: Rolling Purged / Expanding Purged
  - Splits: Number of CV folds

3. Click **Launch Registration & Training Job**

### Training Status
- **RUNNING**: Model training in progress
- **SUCCESS**: Training complete, model ready

### Model Search Spaces

**XGBoost (ml.xgboost)**
```
max_depth: 3-10
learning_rate: 0.005-0.3 (log)
n_estimators: 100-800
subsample: 0.5-1.0
```

**LightGBM (ml.lightgbm)**
```
n_estimators: 100-600
num_leaves: 20-100
learning_rate: 0.01-0.2 (log)
```

---

## Signal Builder

### Purpose
Configure trading signal logic using a rule tree interface.

### Signal List (Left Panel)
- Browse and select signal logic rules
- Display: Name, Output Mode, Position Mode

### Rule Tree Editor (Right Panel)

#### Creating Signals
1. Click **+ Create Signal**
2. Configure:
   - **Name**: Rule identifier
   - **Description**: Optional notes
   - **Output Mode**: discrete / numeric
   - **Position Mode**: long_only / long_short / portfolio
3. Click **Register Rule**

#### Rule Tree Structure
Signals use a hierarchical rule tree:

```
ROOT (Group)
├── Combinator: AND/OR
├── Action: BUY/SELL/HOLD
└── Children:
    ├── Condition (field, operator, value)
    │   └── Example: model_pred_return >= 0.01
    └── Group (nested)
        ├── Combinator: AND/OR
        └── Children: ...
```

### Adding Rules
- **Add Condition**: Add leaf node with field/operator/value
- **Add Group**: Add nested group for complex logic

### Signal Preview
1. Click **Simulate Signals**
2. View results:
   - Total bars simulated
   - Signal rate percentage
   - BUY/SELL/HOLD counts
   - Detailed trigger table

---

## Backtest Lab

### Purpose
Execute historical backtests to evaluate strategy performance.

### Backtest Configuration

#### Parameters Panel (Left)
- **Strategy**: Select target strategy
- **Symbol**: Asset to backtest
- **Timeframe**: Data frequency
- **Capital**: Initial capital ($)
- **Commission**: In basis points
- **Slippage**: In basis points
- **Engine**: vectorbt / backtrader
- **Date Range**: Start and End dates

### Running a Backtest
1. Configure parameters
2. Click **Launch Backtest**
3. Monitor progress in Celery Queue

### Results Dashboard

#### Performance Metrics
| Metric | Description |
|--------|-------------|
| Sharpe Ratio | Risk-adjusted return |
| CAGR | Compound Annual Growth Rate |
| Max Drawdown | Peak-to-trough decline |
| Win Rate | Percentage of profitable trades |
| VaR (95%) | Value at Risk at 95% confidence |
| CVaR (99%) | Conditional Value at Risk |

#### Charts
- **Equity Curve**: Cumulative returns over time
- **Drawdown Chart**: Drawdown depth trajectory

#### Trade Blotter
Detailed executed trades table:
- Trade ID, Side, Entry/Exit Dates
- Entry/Exit Prices
- Net PnL, Return %

---

## Experiment Tracker

### Purpose
Compare and audit MLflow experiment runs with side-by-side lineage analysis.

### Features

#### Comparison Mode
Select up to 3 experiments for comparison:
- **Side-by-Side Table**:
  - Strategy Version
  - IS Sharpe (In-Sample)
  - OOS Sharpe (Out-of-Sample)
  - Overfitting Ratio (IS/OOS)
  - MLflow Artifact Storage (S3)

#### Experiment Table
All logged experiments with:
- **Diff Checkbox**: Select for comparison
- **Run ID**: Experiment identifier
- **Git Commit Hash**: Code version
- **Strat Version**: v1.0 / v2.0
- **IS/OOS Sharpe**: Performance metrics
- **Overfitting Ratio**: Stability indicator
- **Created**: Timestamp

### Interpretation
- **Overfitting Ratio < 1.3**: STABLE (green)
- **Overfitting Ratio > 1.3**: DEGRADED (red)
- **Best OOS Sharpe**: Marked with ★ BEST

---

## Validation Center

### Purpose
Formal validation using institutional-grade methods to prevent overfitting.

### Validation Gate Status
**CLEAR** - Strategy passed all validation gates

### Key Metrics
| Metric | Value | Threshold |
|--------|-------|-----------|
| Overfitting Score (PBO) | 1.18 | < 1.3 |
| Walk-Forward Folds | 6/6 | 100% profitable |
| CPCV Mean Sharpe | 2.08 | Across 16 paths |
| Deflator Ratio | 0.94 | Bailey & de Prado |

### Validation Methods

#### 1. Purged Walk-Forward Matrix
- Out-of-sample Sharpe trajectory across expanding folds
- **Embargo Window**: 5 bars
- **Purge Window**: 10 bars

#### 2. Combinatorial Purged CV (CPCV)
- Evaluates all C(N, k) backtest trajectories
- **Min Path Sharpe**: 1.72
- Ensures no single lucky historical split

#### 3. De Prado Deflated Sharpe
- Adjusts Sharpe for:
  - Number of trials attempted
  - Variance of trial Sharpe Ratios
  - Skewness/kurtosis of returns
- **Deflated Sharpe Probability**: 99.4%

### Running Validation
Click **Re-verify Validation Gate** to trigger:
- Walk-forward analysis
- CPCV computation
- Overfitting assessment

---

## AI Researcher (Agentic Pipeline)

### Purpose
Multi-agent system for automated strategy research and discovery.

### Interface Layout

#### Chat Panel (Left)
- Natural language input for research queries
- Message history with AI responses
- Streaming response support

#### Agent Pipeline (Middle)
Visual representation of multi-agent workflow:
1. 🔬 Research Setup (MarketDataAgent)
2. ⚙️ Feature Discovery (FeatureDiscoveryAgent)
3. ⚙️ Model Discovery (ModelTrainingAgent)
4. ⚙️ Tuning Engine (HyperparameterTuningAgent)
5. ⚙️ Backtest Engine (BacktestAgent)
6. ⚙️ Validation Center (ValidationAgent)
7. ⚙️ Governance Check (RiskAssessmentAgent)

#### Live Telemetry Panel (Right)
Real-time strategy construction status:
1. Strategy Name & Status
2. Universe & Timeframe
3. Features List
4. Model & Parameters
5. Backtest Performance
6. Validation Metrics
7. Governance Audit

### Research Workflow

#### Starting Research
1. Enter query in chat (e.g., "Build a mean reversion strategy for tech stocks")
2. Click **Run Research Pipeline**
3. Watch agent pipeline execute

#### Research States
- **empty**: No strategy
- **building**: Agents working
- **validated**: Strategy passed gates
- **halted**: Validation failed

#### Actions
- **View in Strategy Explorer**: Jump to created strategy
- **Run Another Backtest**: Open Backtest Lab
- **Promote to Portfolio Layer**: Deploy to production

### Agent Capabilities
- Market data retrieval
- Feature discovery and engineering
- Model selection and training
- Hyperparameter optimization
- Backtest execution
- Walk-forward validation
- Governance compliance checks

---

## Troubleshooting

### Common Issues

#### "NO_STRATEGIES_FOUND"
- Backend may not be connected
- Check if API base URL is correct
- Verify backend service is running

#### "LOADING_CATALOG..." (stuck)
- Network connectivity issue
- API timeout
- Clear browser cache and refresh

#### Charts Not Rendering
- Check browser console for errors
- Ensure WebGL/Canvas support
- Try different browser (Chrome recommended)

#### Celery Queue Not Updating
- Backend Celery workers may be down
- Check task status via API: `/api/v1/tasks/{task_id}`
- Refresh page to poll again

### API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/strategies` | GET/POST | List/Create strategies |
| `/api/v1/strategies/{id}` | GET/PATCH/DELETE | Strategy CRUD |
| `/api/v1/strategies/{id}/promote` | POST | Promote to production |
| `/api/v1/features` | GET/POST | List/Create features |
| `/api/v1/features/{id}/generate` | POST | Generate feature data |
| `/api/v1/models` | GET/POST | List/Create models |
| `/api/v1/models/{id}/train/async` | POST | Async model training |
| `/api/v1/signals` | GET/POST | List/Create signals |
| `/api/v1/backtests` | GET/POST | List/Create backtests |
| `/api/v1/backtests/{id}/execute` | POST | Execute backtest |
| `/api/v1/experiments` | GET | List experiments |
| `/api/v1/experiments/compare` | POST | Compare experiments |
| `/api/v1/validation/walk-forward/async` | POST | Walk-forward analysis |
| `/api/v1/validation/cpcv/async` | POST | CPCV analysis |
| `/api/v1/agents/research` | POST | Submit research query |
| `/api/v1/agents/chat` | POST | Chat with AI agent |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | Railway backend URL | API endpoint |
| `VITE_GEMINI_API_KEY` | - | Gemini API key for AI |

### Browser Requirements
- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Required**: JavaScript enabled, WebGL for charts
- **Resolution**: 1280x720 minimum

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1-9` | Quick nav to sidebar modules |
| `Ctrl+S` | Save current workspace |
| `Ctrl+K` | Global search |
| `Esc` | Close modal/drawer |

---

## Support

For issues or questions:
1. Check browser console for error details
2. Verify backend connectivity
3. Review API response in Network tab
4. Contact development team with error logs

---

*BLACKWOOD CAPITAL QUANT v5.0 - Institutional Quantitative Research Platform*
