import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(/* error, info */) {
    // optional: hook to log errors externally
  }

  reset = () => {
    this.setState((s) => ({
      hasError: false,
      error: null,
      resetKey: s.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border rounded bg-red-50">
          <div className="font-semibold text-red-700 mb-2">
            Editor failed to load
          </div>
          <div className="text-sm text-gray-700 mb-3">
            {String(this.state.error?.message || this.state.error)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={this.reset}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Retry
            </button>
            {this.props.fallbackAction}
          </div>
        </div>
      );
    }

    // Render children normally. We include a key so parent can force remount on retry.
    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
