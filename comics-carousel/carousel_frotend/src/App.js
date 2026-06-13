import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import ShowPage from './pages/ShowPage';
import SettingsPage from './pages/SettingsPage';
import ResultPage from './pages/ResultPage';
import AdminPage from './pages/AdminPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<ShowPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/config" element={<SettingsPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;