import { HEALTH_CATEGORIES, answeredHealthTopics } from './health-check-data';

export function radarPoint(index: number, score: number, radius = 140) {
  const angle = index * Math.PI / 4 - Math.PI / 2;
  return { x: 200 + Math.cos(angle)*radius*score/5, y: 200 + Math.sin(angle)*radius*score/5 };
}

export default function HealthCheckChart({ own, other, names }: { own: (number|null)[]; other: (number|null)[]; names: string[] }) {
  const labels = [['Liebe &','Wertschätzung'],['Kommunikation'],['Vertrauen &','Sicherheit'],['Nähe &','Intimität'],['Quality Time'],['Freiheit &','Individualität'],['Fairness &','Beziehungsarbeit'],['Spaß &','Leichtigkeit']];
  const answered = answeredHealthTopics(own, other);
  if (!answered.length) return <div className="health-chart health-chart-empty"><p>Noch keine Antworten.</p></div>;
  return <div className="health-chart"><svg viewBox="-10 20 420 390" role="img" aria-label="Health Check – beantwortete Themen beider Partner">
    <title>Health Check – beantwortete Themen</title>
    {[1,2,3,4,5].map(level => <polygon key={level} points={HEALTH_CATEGORIES.map((_,i) => {const p=radarPoint(i,level);return `${p.x},${p.y}`;}).join(' ')} fill="none" stroke="var(--retro-info-rule)" strokeWidth="1"/>)}
    {answered.map(i => {const c=HEALTH_CATEGORIES[i],p=radarPoint(i,5),label=radarPoint(i,5,163);const x=i===2?320:i===6?80:label.x;return <g key={c.id}><line x1="200" y1="200" x2={p.x} y2={p.y} stroke="var(--retro-info-rule)"/><text x={x} y={label.y} textAnchor="middle" fill="var(--color-text-primary)" fontSize="12">{labels[i].map((line,j) => <tspan key={line} x={x} dy={j===0?'0':'15'}>{line}</tspan>)}</text></g>;})}
    {[1,2,3,4,5].map(n => <text key={n} x="204" y={200-n*28} fontSize="10" fill="var(--retro-info-text)">{n}</text>)}
    {[own,other].map((scores,person) => scores.some(n => n !== null) && <g key={person} className={person===0?'health-one':'health-two'}>
      {scores.every(n => n !== null) && <polygon points={scores.map((n,i) => {const p=radarPoint(i,n??0);return `${p.x},${p.y}`;}).join(' ')} fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"/>}
      {!scores.every(n=>n!==null) && scores.map((n,i) => {const next=scores[(i+1)%8];if(n===null||next===null)return null;const a=radarPoint(i,n),b=radarPoint((i+1)%8,next);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeWidth="2"/>;})}
      {scores.map((n,i) => {if(n === null)return null;const p=radarPoint(i,n);return <circle key={i} cx={p.x} cy={p.y} r="4" fill="currentColor" stroke="currentColor" strokeWidth="1.5"><title>{names[person] ? `${names[person]} · ` : ''}{HEALTH_CATEGORIES[i].title}: {n}/5</title></circle>;})}
      {names[person] && <text x={person===0?100:300} y="395" textAnchor="middle" fill="currentColor" fontSize="13">{names[person]}</text>}
    </g>)}
  </svg></div>;
}