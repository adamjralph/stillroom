import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Creator } from './components/Creator';
import { RoomViewer } from './components/RoomViewer';
import { CreatedRoom } from './components/CreatedRoom';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Creator />} />
        <Route path="/created/:id" element={<CreatedRoom />} />
        <Route path="/r/:id" element={<RoomViewer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;