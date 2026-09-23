export const Skeleton = ({ width = '100%', height = 16, className = '', circle = false, style = {} }) => (
  <div
    className={`skeleton ${circle ? 'skeleton-circle' : ''} ${className}`}
    style={{ width, height: circle ? width : height, borderRadius: circle ? '50%' : undefined, ...style }}
  />
);

export const SkeletonStatCard = () => (
  <div className="stat-card" style={{ borderLeftColor: '#e2e8f0' }}>
    <Skeleton width={32} height={32} style={{ marginBottom: 10 }} />
    <Skeleton height={36} width="60%" style={{ marginBottom: 8 }} />
    <Skeleton height={12} width="80%" />
  </div>
);

export const SkeletonExamCard = () => (
  <div className="exam-card">
    <div style={{ height: 4, background: '#e2e8f0' }} />
    <div className="exam-card-header">
      <Skeleton className="skeleton-title" style={{ marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <Skeleton width={60} height={20} />
        <Skeleton width={70} height={20} />
      </div>
    </div>
    <div className="exam-card-body">
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        {[60, 70, 55, 80].map((w, i) => <Skeleton key={i} width={w} height={14} />)}
      </div>
      <Skeleton height={38} />
    </div>
    <div className="exam-card-footer" style={{ background: '#fafbfc' }}>
      <Skeleton width={50} height={14} />
      <Skeleton width={100} height={32} />
    </div>
  </div>
);

export const SkeletonTableRow = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: '13px 16px' }}>
        <Skeleton height={14} width={i === 0 ? 30 : i === cols - 1 ? 70 : '80%'} />
      </td>
    ))}
  </tr>
);

export const SkeletonResultStat = () => (
  <div className="result-stat-card">
    <Skeleton height={36} width="50%" style={{ margin: '0 auto 8px' }} />
    <Skeleton height={12} width="70%" style={{ margin: '0 auto' }} />
  </div>
);

export default Skeleton;
