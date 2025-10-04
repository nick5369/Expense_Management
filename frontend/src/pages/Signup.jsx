import React, { useState } from 'react'
import countries from '../utils/countries'
import { signup, saveAuth } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', country: 'United States' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    // clear error for this field when user types
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }))
  }

  const validate = () => {
    const err = {}
    if (!form.name.trim()) err.name = 'Name is required.'
    if (!form.email.trim()) err.email = 'Email is required.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) err.email = 'Enter a valid email address.'
    if (!form.password) err.password = 'Password is required.'
    else if (form.password.length < 6) err.password = 'Password must be at least 6 characters.'
    if (!form.confirm) err.confirm = 'Please confirm your password.'
    else if (form.password !== form.confirm) err.confirm = 'Passwords do not match.'
    if (!form.country) err.country = 'Please select a country.'
    return err
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) {
      setErrors(err)
      return
    }
    setServerError(null)
    setLoading(true)
    // call backend
    signup({
      name: form.name,
      email: form.email,
      password: form.password,
      companyName: form.name || form.email,
      country: form.country,
      locale: form.country,
    })
      .then((data) => {
        if (data.token) saveAuth(data.token, data.user)
        // redirect to signin or homepage
        navigate('/signin')
      })
      .catch((err) => {
        console.error('signup error', err)
        setServerError(err.message || 'Signup failed')
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="bg-white shadow rounded p-6">
      <h2 className="text-2xl font-bold mb-4">Admin (company) Signup</h2>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {serverError && <div className="text-sm text-red-700 mb-2">{serverError}</div>}
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input name="name" value={form.name} onChange={onChange} required className="mt-1 block w-full rounded border px-3 py-2" />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" value={form.email} onChange={onChange} type="email" required className="mt-1 block w-full rounded border px-3 py-2" />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input name="password" value={form.password} onChange={onChange} type="password" required minLength={6} className="mt-1 block w-full rounded border px-3 py-2" />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Confirm password</label>
            <input name="confirm" value={form.confirm} onChange={onChange} type="password" required className="mt-1 block w-full rounded border px-3 py-2" />
            {errors.confirm && <p className="text-sm text-red-600 mt-1">{errors.confirm}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Country selection</label>
          <select name="country" value={form.country} onChange={onChange} required className="mt-1 block w-full rounded border px-3 py-2">
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c.name} value={c.name}>{c.name} ({c.currency})</option>
            ))}
          </select>
          {errors.country && <p className="text-sm text-red-600 mt-1">{errors.country}</p>}
          <p className="text-sm text-slate-500 mt-2">Selected country's currency will be used as company's base currency.</p>
        </div>

        <div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-60">
            {loading ? 'Signing up…' : 'Signup'}
          </button>
        </div>
      </form>
    </div>
  )
}
