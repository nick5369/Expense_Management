import React, { useState } from 'react'
import { login, saveAuth } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function Signin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = (e) => {
    e.preventDefault()
    const err = {}
    if (!form.email.trim()) err.email = 'Email is required.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) err.email = 'Enter a valid email address.'
    if (!form.password) err.password = 'Password is required.'
    setErrors(err)
    if (Object.keys(err).length) return

    setServerError(null)
    setLoading(true)
    login({ email: form.email, password: form.password })
      .then((data) => {
        if (data.token) saveAuth(data.token, data.user)
        navigate('/')
      })
      .catch((err) => {
        console.error('login error', err)
        setServerError(err.message || 'Login failed')
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow rounded p-6">
      <h2 className="text-2xl font-bold mb-4">Sign in</h2>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {serverError && <div className="text-sm text-red-700">{serverError}</div>}
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" value={form.email} onChange={onChange} type="email" required className="mt-1 block w-full rounded border px-3 py-2" />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input name="password" value={form.password} onChange={onChange} type="password" required className="mt-1 block w-full rounded border px-3 py-2" />
          {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
        </div>

        <div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-60" disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <a href="/signup" className="text-slate-600">Don't have an account? Signup</a>
          <button type="button" className="text-indigo-600" onClick={() => alert('This would trigger password reset flow (demo).')}>Forgot password?</button>
        </div>
      </form>
    </div>
  )
}
