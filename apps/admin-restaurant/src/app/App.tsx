import { env } from '@/shared/config/env';

export default function App() {
  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        gap: 8,
      }}
    >
      <h1>FoodHub — админка ресторана</h1>
      <p style={{ color: '#666' }}>Каркас готов.</p>
      <p style={{ color: '#999', fontSize: 12 }}>API: {env.apiUrl}</p>
    </main>
  );
}
