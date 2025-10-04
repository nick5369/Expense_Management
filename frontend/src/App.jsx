import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Signup from './pages/Signup'
import Signin from './pages/Signin'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="p-4 border-b bg-white shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Expense Management</h1>
          <nav className="space-x-3">
            <Link to="/signin" className="text-sm text-slate-600 hover:underline">Sign in</Link>
            <Link to="/signup" className="text-sm text-slate-600 hover:underline">Sign up</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<Signin />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
    </div>
  )
}
