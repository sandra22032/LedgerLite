import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [transactions, setTransactions] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || url === 'YOUR_SUPABASE_PROJECT_URL' || !key || key === 'YOUR_SUPABASE_ANON_KEY') {
      setIsConfigured(false);
      setLoading(false);
    } else {
      fetchTransactions();
      fetchSavings();
    }
  }, []);

  async function fetchSavings() {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching savings:', error);
    } else {
      setSavings(data || []);
    }
  }

  async function fetchTransactions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  }

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'expense',
    category: '🛒'
  });

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const balance = income - expenses;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    const newTransaction = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([newTransaction])
      .select();

    if (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Check your Supabase connection.');
    } else {
      setTransactions([data[0], ...transactions]);
      setFormData({ name: '', amount: '', type: 'expense', category: '🛒' });
    }
  };

  const addSavingsGoal = async (name, target) => {
    const { data, error } = await supabase
      .from('savings_goals')
      .insert([{ name, target_amount: parseFloat(target) }])
      .select();

    if (error) {
      console.error('Error adding goal:', error);
    } else {
      setSavings([data[0], ...savings]);
    }
  };

  const updateSavingsAmount = async (id, current) => {
    const amount = prompt('Contribution amount:');
    if (!amount) return;

    const newAmount = current + parseFloat(amount);
    const { error } = await supabase
      .from('savings_goals')
      .update({ current_amount: newAmount, is_completed: newAmount >= savings.find(g => g.id === id).target_amount })
      .eq('id', id);

    if (error) {
      console.error('Error updating goal:', error);
    } else {
      fetchSavings();
    }
  };

  if (!isConfigured) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 className="logo-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>LedgerLite</h1>
        <div className="glass" style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
          <h2>Supabase Setup Required</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>
            Please update your <code>.env</code> file with your Supabase credentials to start tracking your finances.
          </p>
          <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
            <code>
              VITE_SUPABASE_URL=your_url<br />
              VITE_SUPABASE_ANON_KEY=your_key
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <div className="logo-text">LedgerLite</div>
        <div className="user-profile">
          <span style={{ color: 'var(--text-muted)' }}>Welcome back, User</span>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card glass">
          <span className="stat-label">Total Balance</span>
          <span className="stat-value">₹{balance.toLocaleString('en-IN')}</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Monthly Income</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>₹{income.toLocaleString('en-IN')}</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Monthly Expenses</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>₹{expenses.toLocaleString('en-IN')}</span>
        </div>
      </section>

      <section className="savings-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Savings Goals</h2>
          <button className="btn-secondary" onClick={() => {
            const name = prompt('Goal Name (e.g., New Car)');
            const target = prompt('Target Amount');
            if (name && target) addSavingsGoal(name, target);
          }}>+ New Goal</button>
        </div>
        <div className="savings-grid">
          {savings.map(goal => {
            const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
            return (
              <div key={goal.id} className="savings-card glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{goal.emoji}</span>
                  <span className={`status ${goal.is_completed ? 'completed' : ''}`}>
                    {goal.is_completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{goal.name}</h3>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    ₹{Number(goal.current_amount).toLocaleString('en-IN')} / ₹{Number(goal.target_amount).toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{Math.round(progress)}%</span>
                </div>
                <button
                  style={{ marginTop: '1rem', width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                  className="btn-outline"
                  onClick={() => updateSavingsAmount(goal.id, goal.current_amount)}
                >
                  Add Contribution
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="main-content">
        <section className="transaction-list glass">
          <h2 style={{ marginBottom: '1.5rem' }}>Transactions by Category</h2>
          {Object.entries(
            transactions.reduce((acc, t) => {
              if (!acc[t.category]) acc[t.category] = [];
              acc[t.category].push(t);
              return acc;
            }, {})
          ).map(([category, items]) => (
            <div key={category} className="category-group">
              <div className="category-head">
                <span className="category-icon-small">{category}</span>
                <span>{category === '💰' ? 'Income' :
                  category === '🏠' ? 'Rent & Housing' :
                    category === '🛒' ? 'Shopping' :
                      category === '🍔' ? 'Food & Drink' :
                        category === '🚗' ? 'Transport' :
                          category === '🎬' ? 'Entertainment' : 'Other'}</span>
              </div>
              {items.map(t => (
                <div key={t.id} className="transaction-item">
                  <div className="transaction-info">
                    <div>
                      <div className="transaction-name">{t.name}</div>
                      <div className="transaction-date">{t.date}</div>
                    </div>
                  </div>
                  <div className={`amount ${t.type}`}>
                    {t.type === 'income' ? '+' : '-'}₹{Math.abs(t.amount).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>

        <section className="add-transaction glass">
          <div className="add-form">
            <h2 style={{ marginBottom: '0.5rem' }}>New Transaction</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Starbucks"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="🛒">Shopping</option>
                  <option value="🍔">Food</option>
                  <option value="🚗">Transport</option>
                  <option value="🎬">Entertainment</option>
                  <option value="💰">Income</option>
                  <option value="🏠">Rent</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Type</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ flex: 1, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    /> Expense
                  </label>
                  <label style={{ flex: 1, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    /> Income
                  </label>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
                Add Transaction
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
