import type { ReactNode } from 'react';

export function LoadingState(props: { title?: string }) {
  return <div style={{ padding: 12 }}>{props.title ?? 'Loading…'}</div>;
}

export function ErrorState(props: { title?: string; details?: ReactNode }) {
  return (
    <div
      style={{
        padding: 12,
        border: '1px solid #f2c2c2',
        background: '#fff7f7',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {props.title ?? 'Something went wrong'}
      </div>
      {props.details ? (
        <div style={{ color: '#8a1f1f' }}>{props.details}</div>
      ) : null}
    </div>
  );
}

export function EmptyState(props: { title?: string; details?: ReactNode }) {
  return (
    <div
      style={{
        padding: 12,
        border: '1px solid #e6e6e6',
        background: '#fafafa',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {props.title ?? 'Nothing here'}
      </div>
      {props.details ? (
        <div style={{ color: '#555' }}>{props.details}</div>
      ) : null}
    </div>
  );
}
