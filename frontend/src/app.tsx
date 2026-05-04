import Router from 'preact-router';
import { DictionaryPage } from './pages/DictionaryPage';
import { AdminPage } from './pages/admin/AdminPage';

export function App() {
  return (
    <Router>
      <AdminPage path="/admin/:rest*" />
      <DictionaryPage path="/:rest*" default />
    </Router>
  );
}
