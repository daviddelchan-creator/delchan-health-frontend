'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import InputMask from 'react-input-mask';

function RegistrationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addNewTenant } = useTenant();

  const [form, setForm] = useState({
    clinicName: '',
    professionalName: '',
    documentCpfCnpj: '',
    councilType: 'CRM',
    councilNumber: '',
    uf: 'SP',
    email: '',
    phone: '',
    password: '',
    plan: searchParams.get('plan') || 'starter',
    billingCycle: searchParams.get('billing') || 'monthly',
    acceptedTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; name: string } | null>(null);
  const [redirectTimeout, setRedirectTimeout] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [redirectTimeout]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/provision-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar cadastro.');
      }

      if (data.success && data.tenant) {
        // Store in context/localStorage
        addNewTenant({
          name: data.tenant.name,
          cnpj: form.documentCpfCnpj,
          city: form.uf, // simplified for demo
          color: '#0d9488',
          plan: data.tenant.plan,
          status: 'trial',
          doctorsCount: 1,
        });

        // Store session for immediate access
        localStorage.setItem('delchan_onboarding_session', JSON.stringify({
          token: 'dummy-session-token',
          user: { name: data.tenant.professionalName, email: data.tenant.email },
          tenant: data.tenant
        }));

        setCredentials({ email: data.tenant.email, name: data.tenant.professionalName });
        setSuccess(true);

        // Redirect after a delay to show confirmation
        const timeout = window.setTimeout(() => {
          router.push(data.redirectUrl);
        }, 5000);
        setRedirectTimeout(timeout);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Side Panel */}
      <div style={{ flex: 1, padding: '2rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h2>Plano Escolhido: {form.plan.toUpperCase()}</h2>
        <p>Ciclo: {form.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</p>
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '8px', color: '#0369a1', fontWeight: 'bold' }}>
          7 dias de teste grátis • Sem cobrança hoje • Cancele quando quiser
        </div>
        <div style={{ marginTop: '2rem' }}>
          <label>Mudar Plano: </label>
          <select name="plan" value={form.plan} onChange={handleInputChange} style={{ padding: '0.5rem' }}>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 2 }}>
        {success ? (
          <div style={{ padding: '2rem', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981' }}>
            <h1 style={{ color: '#065f46', marginTop: 0 }}>Conta criada com sucesso!</h1>
            <p>Bem-vindo(a), {credentials?.name}. Seu tenant foi aprovisionado.</p>
            <div style={{ margin: '1.5rem 0', padding: '1rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              <strong>E-mail de acesso:</strong> {credentials?.email}
            </div>
            <p>Você será redirecionado para o painel em alguns segundos...</p>
            <button
              onClick={() => router.push('/setup?onboarding=success')}
              style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Acessar Painel Agora
            </button>
          </div>
        ) : (
          <>
            <h1>Cadastro</h1>
            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Nome da Clínica ou Consultório</label><br />
            <input type="text" name="clinicName" value={form.clinicName} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label>Nome Completo do Profissional Responsável</label><br />
            <input type="text" name="professionalName" value={form.professionalName} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label>CPF ou CNPJ</label><br />
            <InputMask
              name="documentCpfCnpj"
              value={form.documentCpfCnpj}
              onChange={handleInputChange}
              mask={form.documentCpfCnpj.replace(/\D/g, '').length <= 11 ? "999.999.999-999" : "99.999.999/9999-99"}
              maskChar={null}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            >
              {(inputProps: any) => <input {...inputProps} type="text" />}
            </InputMask>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label>Conselho</label><br />
              <select name="councilType" value={form.councilType} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem' }}>
                <option value="CRM">CRM</option>
                <option value="CRBM">CRBM</option>
                <option value="COREN">COREN</option>
                <option value="CRO">CRO</option>
                <option value="CREFITO">CREFITO</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Número do Registro</label><br />
              <input type="text" name="councilNumber" value={form.councilNumber} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>UF</label><br />
              <input type="text" name="uf" value={form.uf} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem' }} />
            </div>
          </div>
          <div>
            <label>E-mail Profissional</label><br />
            <input type="email" name="email" value={form.email} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label>WhatsApp</label><br />
            <input type="tel" name="phone" value={form.phone} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label>Senha de Acesso</label><br />
            <input type="password" name="password" value={form.password} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem' }} />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <input type="checkbox" name="acceptedTerms" checked={form.acceptedTerms} onChange={handleInputChange} required />
              <span>
                Declaro que li e concordo integralmente com os <a href="/termos" target="_blank">Termos de Uso e SLA</a>, a <a href="/privacidade" target="_blank">Política de Privacidade</a> e o <a href="/dpa-lgpd" target="_blank">Acordo de Processamento de Dados Sensíveis de Saúde (DPA - LGPD)</a>, atuando como Controlador dos dados clínicos inseridos.
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading} style={{ padding: '1rem', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}>
            {loading ? 'Aprovisionando...' : 'Finalizar Cadastro'}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RegistrationForm />
    </Suspense>
  );
}
