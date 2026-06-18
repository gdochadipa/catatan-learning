import React, { useEffect, useState } from 'react';
import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { useDebounce } from './useDebounce';

interface Campaign {
  id: string;
  name: string;
  impressions: number;
  status: 'active' | 'paused';
}

// RTK Async Thunk to retrieve real-time campaigns from our Go API concurrent gateway
export const fetchCampaigns = createAsyncThunk('campaigns/fetch', async () => {
  const res = await fetch('http://localhost:8080/api/campaigns');
  if (!res.ok) throw new Error('Failed to retrieve campaigns from GATD server');
  return (await res.json()) as Campaign[];
});

const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState: { list: [] as Campaign[], loading: false, error: null as string | null },
  reducers: {
    toggleStatus(state, action: PayloadAction<string>) {
      // Direct mutative syntax is made safe & immutable by Immer under the hood
      const camp = state.list.find(c => c.id === action.payload);
      if (camp) {
        camp.status = camp.status === 'active' ? 'paused' : 'active';
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Network error';
      });
  }
});

const { toggleStatus } = campaignsSlice.actions;

const store = configureStore({
  reducer: { campaigns: campaignsSlice.reducer }
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: campaigns, loading, error } = useSelector((state: RootState) => state.campaigns);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Apply our custom search debounce hook
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>GATD Ad Delivery Dashboard</h1>
      <input
        type="text"
        placeholder="Search campaigns..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: 8, width: 300, marginBottom: 16 }}
      />
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {loading ? (
        <p>Loading concurrently from Go API...</p>
      ) : (
        <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Impressions</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.impressions.toLocaleString()}</td>
                <td>
                  <span style={{ color: c.status === 'active' ? 'green' : 'red', fontWeight: 'bold' }}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <button onClick={() => dispatch(toggleStatus(c.id))}>
                    Toggle Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Dashboard />
    </Provider>
  );
}
