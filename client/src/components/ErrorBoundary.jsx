import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('Page rendering failed:', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="mx-auto my-16 max-w-xl rounded-2xl bg-white p-10 text-center shadow-soft"><p className="text-sm font-bold uppercase tracking-widest text-amber-700">Something went wrong</p><h1 className="mt-3 text-2xl font-bold">This page hit a snag.</h1><p className="mt-2 text-slate-500">Try returning home and opening the page again.</p><Link className="mt-6 inline-flex rounded-lg bg-navy px-5 py-3 font-semibold text-white" to="/" onClick={() => this.setState({ failed: false })}>Back to home</Link></main>;
  }
}
