import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUtms } from '../utils/utm.js';
import { createLead } from '../services/api.js';
import ScheduleSlots from '../components/ScheduleSlots.jsx';

const QUIZ_QUESTIONS = [
  {
    id: 'inversion_nube',
    question: '¿Cuál es tu inversión mensual en infraestructura de nube?',
    options: [
      { value: 'Menos de $3,000 USD/mes', descalifica: true },
      { value: '$3,000 - $5,000 USD/mes', descalifica: false },
      { value: '$5,000 - $10,000 USD/mes', descalifica: false },
      { value: 'Más de $10,000 USD/mes', descalifica: false },
    ],
  },
  {
    id: 'proveedor_nube',
    question: '¿Cuál es tu proveedor de nube principal?',
    options: [
      { value: 'AWS', descalifica: false },
      { value: 'Oracle Cloud (OCI)', descalifica: false },
      { value: 'Microsoft Azure', descalifica: false },
      { value: 'Google Cloud Platform (GCP)', descalifica: false },
      { value: 'IBM Cloud', descalifica: false },
      { value: 'Huawei Cloud', descalifica: false },
      { value: 'Otros proveedores / Hosting tradicional', descalifica: false, requiresDetail: true },
    ],
  },
  {
    id: 'cargo',
    question: '¿Cuál es tu cargo en la organización?',
    options: [
      { value: 'CEO / Founder / Director General', descalifica: false },
      { value: 'CFO / Director Financiero', descalifica: false },
      { value: 'CTO / VP de Ingeniería / Architect Cloud', descalifica: false },
      { value: 'Gerente de TI / Infraestructura', descalifica: false },
      { value: 'Otro rol dentro de la empresa', descalifica: false },
      { value: 'Estudiante / Consultor Independiente / Freelance', descalifica: true },
    ],
  },
  {
    id: 'industria',
    question: '¿Cuál es tu sector / industria?',
    options: [
      { value: 'Software / SaaS / Plataformas Digitales', descalifica: false },
      { value: 'Servicios de TI / BPO / Contact Centers', descalifica: false },
      { value: 'FinTech / E-commerce / AdTech', descalifica: false },
      { value: 'Comercio / Retail / Servicios Tradicionales', descalifica: false },
      { value: 'Otro sector', descalifica: false },
    ],
  },
];

const CONTACT_STEP = 0;
const RESULT_STEP = QUIZ_QUESTIONS.length + 1;

const INITIAL_CONTACT = {
  nombre: '',
  email: '',
  telefono: '',
  empresa: '',
  tratamientoDatosAceptado: false,
};

const primaryButtonStyle = {
  padding: '12px 28px',
  borderRadius: 999,
  border: 'none',
  background: '#F8F522',
  color: '#000',
  cursor: 'pointer',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 700,
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
};

const eyebrowStyle = {
  margin: '0 0 6px',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: '#F8F522',
};

const labelStyle = {
  display: 'block',
  margin: '0 0 6px',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '.04em',
  color: '#B4B4B4',
};

const errorTextStyle = {
  margin: '6px 0 0',
  fontSize: 12,
  color: '#FF6B6B',
};

function getInputStyle(hasError) {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${hasError ? '#FF6B6B' : 'rgba(255,255,255,.16)'}`,
    background: 'transparent',
    color: '#fff',
    fontSize: 14,
    fontFamily: "'Source Sans 3', system-ui, sans-serif",
  };
}

function validateContact(contact) {
  const errors = {};
  if (!contact.nombre.trim()) errors.nombre = 'Ingresa tu nombre.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
    errors.email = 'Ingresa un email válido.';
  }
  if (!contact.telefono.trim()) errors.telefono = 'Ingresa tu teléfono.';
  if (!contact.empresa.trim()) errors.empresa = 'Ingresa el nombre de tu empresa.';
  if (!contact.tratamientoDatosAceptado) {
    errors.tratamientoDatosAceptado = 'Debes aceptar el tratamiento de tus datos personales.';
  }
  return errors;
}

export default function FormPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(CONTACT_STEP);
  const [contact, setContact] = useState(INITIAL_CONTACT);
  const [contactErrors, setContactErrors] = useState({});
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailText, setDetailText] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [submitError, setSubmitError] = useState('');
  const [leadId, setLeadId] = useState(null);
  const [backendCalificado, setBackendCalificado] = useState(null);
  const hasSubmittedRef = useRef(false);

  const isContactStep = step === CONTACT_STEP;
  const isResultStep = step === RESULT_STEP;
  const currentQuestion = !isContactStep && !isResultStep ? QUIZ_QUESTIONS[step - 1] : null;

  const calificado = useMemo(
    () => isResultStep && answers.every((a) => !a.descalifica),
    [isResultStep, answers]
  );

  function submitLead() {
    const payload = {
      nombre: contact.nombre.trim(),
      email: contact.email.trim(),
      telefono: contact.telefono.trim(),
      empresa: contact.empresa.trim(),
      tratamiento_datos_aceptado: contact.tratamientoDatosAceptado === true,
      utms: getStoredUtms(),
      calificado,
      respuestas: answers,
      landing: 'vsl-macondo',
    };

    setSubmitStatus('loading');
    setSubmitError('');
    return createLead(payload)
      .then((data) => {
        setLeadId(data.leadId);
        setBackendCalificado(data.calificado);
        setSubmitStatus('done');
      })
      .catch((err) => {
        setSubmitError(err.message);
        setSubmitStatus('error');
      });
  }

  useEffect(() => {
    if (!isResultStep || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    submitLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResultStep]);

  function handleContactChange(field, value) {
    setContact({ ...contact, [field]: value });
  }

  function handleContactSubmit() {
    const errors = validateContact(contact);
    setContactErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setStep(1);
  }

  function handleSelect(index) {
    setSelected(index);
    setDetailText('');
  }

  const selectedOption = selected !== null ? currentQuestion?.options[selected] : null;
  const needsDetail = Boolean(selectedOption?.requiresDetail);
  const canAdvance = selected !== null && (!needsDetail || detailText.trim());

  function handleNext() {
    if (!canAdvance) return;
    const option = currentQuestion.options[selected];
    setAnswers([
      ...answers,
      {
        pregunta: currentQuestion.id,
        respuesta: option.value,
        descalifica: option.descalifica,
        detalle: option.requiresDetail ? detailText.trim() : null,
      },
    ]);
    setSelected(null);
    setDetailText('');
    setStep(step + 1);
  }

  function handleBack() {
    if (step === 1) {
      setSelected(null);
      setDetailText('');
      setStep(CONTACT_STEP);
      return;
    }
    const prevQuestionIndex = step - 2;
    const prevQuestion = QUIZ_QUESTIONS[prevQuestionIndex];
    const prevAnswer = answers[prevQuestionIndex];
    const prevIndex = prevQuestion.options.findIndex((o) => o.value === prevAnswer.respuesta);
    setAnswers(answers.slice(0, -1));
    setSelected(prevIndex);
    setDetailText(prevAnswer.detalle || '');
    setStep(step - 1);
  }

  function handleScheduleDone() {
    navigate('/gracias');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#0C0C0C',
          border: '1px solid rgba(248,245,34,.35)',
          borderRadius: 14,
          boxShadow: '0 0 0 6px rgba(248,245,34,.06)',
          padding: '32px 28px',
        }}
      >
        {isContactStep && (
          <>
            <p style={eyebrowStyle}>Antes de comenzar</p>
            <h3
              style={{
                margin: '0 0 20px',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 700,
                fontSize: 20,
                lineHeight: 1.3,
              }}
            >
              Cuéntanos cómo contactarte
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 26 }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text"
                  value={contact.nombre}
                  onChange={(e) => handleContactChange('nombre', e.target.value)}
                  placeholder="Tu nombre completo"
                  style={getInputStyle(Boolean(contactErrors.nombre))}
                />
                {contactErrors.nombre && <p style={errorTextStyle}>{contactErrors.nombre}</p>}
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  placeholder="tu@empresa.com"
                  style={getInputStyle(Boolean(contactErrors.email))}
                />
                {contactErrors.email && <p style={errorTextStyle}>{contactErrors.email}</p>}
              </div>

              <div>
                <label style={labelStyle}>Teléfono</label>
                <input
                  type="tel"
                  value={contact.telefono}
                  onChange={(e) => handleContactChange('telefono', e.target.value)}
                  placeholder="+1 234 567 8900"
                  style={getInputStyle(Boolean(contactErrors.telefono))}
                />
                {contactErrors.telefono && <p style={errorTextStyle}>{contactErrors.telefono}</p>}
              </div>

              <div>
                <label style={labelStyle}>Empresa</label>
                <input
                  type="text"
                  value={contact.empresa}
                  onChange={(e) => handleContactChange('empresa', e.target.value)}
                  placeholder="Nombre de tu empresa"
                  style={getInputStyle(Boolean(contactErrors.empresa))}
                />
                {contactErrors.empresa && <p style={errorTextStyle}>{contactErrors.empresa}</p>}
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={contact.tratamientoDatosAceptado}
                    onChange={(e) => handleContactChange('tratamientoDatosAceptado', e.target.checked)}
                    style={{ marginTop: 3, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: '#B4B4B4' }}>
                    Acepto el tratamiento de mis datos personales según la política de privacidad.
                  </span>
                </label>
                {contactErrors.tratamientoDatosAceptado && (
                  <p style={errorTextStyle}>{contactErrors.tratamientoDatosAceptado}</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleContactSubmit} style={primaryButtonStyle}>
                Siguiente
              </button>
            </div>
          </>
        )}

        {!isContactStep && !isResultStep && (
          <>
            <p style={eyebrowStyle}>
              Pregunta {step} de {QUIZ_QUESTIONS.length}
            </p>

            <div
              style={{
                height: 4,
                background: 'rgba(255,255,255,.12)',
                borderRadius: 999,
                overflow: 'hidden',
                margin: '0 0 22px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(step / QUIZ_QUESTIONS.length) * 100}%`,
                  background: '#F8F522',
                }}
              />
            </div>

            <h3
              style={{
                margin: '0 0 20px',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 700,
                fontSize: 20,
                lineHeight: 1.3,
              }}
            >
              {currentQuestion.question}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(index)}
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: `1px solid ${selected === index ? '#F8F522' : 'rgba(255,255,255,.16)'}`,
                    background: selected === index ? 'rgba(248,245,34,.08)' : 'transparent',
                    color: '#fff',
                    fontSize: 14,
                    lineHeight: 1.4,
                    cursor: 'pointer',
                  }}
                >
                  {option.value}
                </button>
              ))}
            </div>

            {needsDetail && (
              <div style={{ marginBottom: 26, marginTop: -14 }}>
                <label style={labelStyle}>¿Cuál proveedor usas?</label>
                <input
                  type="text"
                  value={detailText}
                  onChange={(e) => setDetailText(e.target.value)}
                  placeholder="Escribe el nombre del proveedor"
                  style={getInputStyle(false)}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <button
                onClick={handleBack}
                style={{
                  padding: '12px 20px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,.16)',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Atrás
              </button>
              <button
                onClick={handleNext}
                disabled={!canAdvance}
                style={{
                  ...primaryButtonStyle,
                  background: canAdvance ? '#F8F522' : 'rgba(248,245,34,.35)',
                  cursor: canAdvance ? 'pointer' : 'default',
                }}
              >
                {step === QUIZ_QUESTIONS.length ? 'Ver resultado' : 'Siguiente'}
              </button>
            </div>
          </>
        )}

        {isResultStep && (submitStatus === 'idle' || submitStatus === 'loading') && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={eyebrowStyle}>Un momento</p>
            <h3 style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18 }}>
              Enviando tu información…
            </h3>
          </div>
        )}

        {isResultStep && submitStatus === 'error' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <h3 style={{ margin: '0 0 12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 20 }}>
              Algo salió mal
            </h3>
            <p style={{ margin: '0 0 20px', color: '#FF6B6B', fontSize: 14, lineHeight: 1.5 }}>{submitError}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 20px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,.16)',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Volver
              </button>
              <button onClick={submitLead} style={primaryButtonStyle}>
                Reintentar
              </button>
            </div>
          </div>
        )}

        {isResultStep && submitStatus === 'done' && backendCalificado && (
          <ScheduleSlots leadId={leadId} contactEmail={contact.email} onClose={handleScheduleDone} />
        )}

        {isResultStep && submitStatus === 'done' && !backendCalificado && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <h3 style={{ margin: '0 0 12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 24 }}>
              ¡Gracias por tu interés!
            </h3>
            <p style={{ margin: '0 0 22px', color: '#B4B4B4', fontSize: 15, lineHeight: 1.6 }}>
              Uno de nuestros asesores revisará tu información y te contactará pronto.
            </p>
            <button onClick={() => navigate('/')} style={primaryButtonStyle}>
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
