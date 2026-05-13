import { TransactionResponse } from '../../core/models/transaction.model';
import { UserResponse } from '../../core/models/user.model';

const FIRST = ['Rakib','Sumaiya','Nasir','Tasnim','Mohammad','Fatema','Arif','Mehedi','Rumana','Sabbir','Anika','Imran','Faisal','Nusrat','Kamrul','Shahriar','Tahmid','Jannatul','Mosharraf','Habiba','Ridwan','Tania','Mahbub','Sadia','Jubair','Farhana'];
const LAST  = ['Hasan','Akter','Uddin','Rahman','Ali','Begum','Hossain','Khatun','Ahmed','Tabassum','Mahmud','Jahan','Islam','Karim','Chowdhury','Siddique','Rashid','Sultana','Khan','Mollah','Bhuiyan','Sarker'];

function rand(n: number): number { return Math.floor(Math.random() * n); }

function fullName(seed: number): string {
  return FIRST[seed % FIRST.length] + ' ' + LAST[(seed * 7) % LAST.length];
}

function randomPhone(seed: string | number): string {
  const ops = ['13','14','15','16','17','18','19'];
  const s = String(seed || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) || rand(99999);
  const o = ops[s % ops.length];
  let n = '01' + o;
  for (let i = 0; i < 8; i++) n += ((s * (i + 3)) % 10);
  return n.slice(0, 11);
}

function randomTrxId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += chars[rand(chars.length)];
  return s;
}

export const MOCK_AGENTS: UserResponse[] = (() => {
  const list: UserResponse[] = [];
  const NUM = 14;
  for (let i = 0; i < NUM; i++) {
    const name = fullName(i + 3);
    const created = new Date(Date.now() - (NUM - i) * 4 * 86400000 - rand(86400000));
    const ops = ['7','8','9','6','5','3'];
    list.push({
      id: 'agt-' + (1000 + i),
      name,
      phone: '01' + ops[i % ops.length] + String(10000000 + (i * 8413 + 1234567) % 89999999),
      role: 'agent',
      isActive: i !== 3 && i !== 9,
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    });
  }
  return list;
})();

export const MOCK_ADMIN: UserResponse = {
  id: 'adm-001', name: 'Ayesha Karim', phone: '01711223344',
  role: 'admin', isActive: true,
  createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export const MOCK_TRANSACTIONS: TransactionResponse[] = (() => {
  const STATUSES = ['paid','paid','paid','paid','received','received','paid'];
  const NUM_TX = 240;
  const now = Date.now();
  const list: TransactionResponse[] = [];
  for (let i = 0; i < NUM_TX; i++) {
    const agent = MOCK_AGENTS[rand(MOCK_AGENTS.length)];
    const daysBack = Math.floor(Math.pow(rand(900) / 30, 0.85));
    const t = new Date(now - daysBack * 86400000 - rand(86400000));
    const amount = (Math.floor((100 + Math.pow(rand(40), 1.6) * 40 + rand(2000)) / 50) * 50).toFixed(2);
    const fee = (parseFloat(amount) * 0.0185).toFixed(2);
    const balance = (1000 + rand(45000)).toFixed(2);
    const status = STATUSES[rand(STATUSES.length)] as 'paid' | 'received';
    const sender = randomPhone(i + 's');
    const trx = randomTrxId();
    const dateStr = `${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${String(t.getFullYear()).slice(2)}`;
    const h12 = (t.getHours() % 12) || 12;
    const ampm = t.getHours() >= 12 ? 'PM' : 'AM';
    const timeStr = `${h12}:${String(t.getMinutes()).padStart(2,'0')} ${ampm}`;
    list.push({
      id: 'tx-' + (10000 + i),
      transactionId: trx,
      amount, fee, balance,
      transactionTime: t.toISOString(),
      status,
      agentId: agent.id,
      agentName: agent.name,
      agentPhone: agent.phone,
      senderPhone: sender,
      receiverPhone: agent.phone,
      rawMessage: `Cash Out Tk ${parseFloat(amount).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})} from ${sender} successful. TrxID ${trx}. Fee Tk ${fee}. Balance Tk ${parseFloat(balance).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}. ${dateStr} ${timeStr}`,
      createdAt: t.toISOString(),
    });
  }
  return list.sort((a, b) => new Date(b.transactionTime).getTime() - new Date(a.transactionTime).getTime());
})();

export interface AgentWithStats extends UserResponse {
  totalPaid: number;
  totalCount: number;
}

export function computeAgentStats(agents: UserResponse[], transactions: TransactionResponse[]): AgentWithStats[] {
  return agents.map(a => {
    const my = transactions.filter(t => t.agentId === a.id && t.status === 'paid');
    return { ...a, totalPaid: my.reduce((s, t) => s + parseFloat(t.amount), 0), totalCount: my.length };
  });
}
