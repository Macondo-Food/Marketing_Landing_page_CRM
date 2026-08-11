import { useEffect, useMemo, useState } from 'react';
import { getStoredUtms } from '../utils/utm.js';

// Preguntas y lógica de calificación según la sección 3 del plan.
// `id` coincide con el campo `pregunta` de la tabla respuestas_quiz.
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
      { value: 'Hosting tradicional / económico (DigitalOcean, Hetzner, cPanel, etc.)', descalifica: true },
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
      { value: 'Estudiante / Consultor Independiente / Freelance', descalifica: true },
    ],
  },
  {
    id: 'industria',
    question: '¿Cuál es tu sector / industria?',
    options: [
      { value: 'Desarrollo de Software / SaaS / Plataformas Digitales', descalifica: false },
      { value: 'BPO / Contact Center / Servicios de TI', descalifica: false },
      { value: 'FinTech / E-commerce de alto tráfico / AdTech', descalifica: false },
      { value: 'Empresa tradicional / Comercio físico / Servicios no tecnológicos', descalifica: true },
    ],
  },
];

// step 0 = datos de contacto, step 1..N = preguntas del quiz, step N+1 = resultado.
const CONTACT_STEP = 0;
const RESULT_STEP = QUIZ_QUESTIONS.length + 1;

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
  return errors;
}

export default function QuizPopup({ onClose }) {
  const [step, setStep] = useState(CONTACT_STEP);
  const [contact, setContact] = useState({ nombre: '', email: '', telefono: '' });
  const [contactErrors, setContactErrors] = useState({});
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);

  const isContactStep = step === CONTACT_STEP;
  const isResultStep = step === RESULT_STEP;
  const currentQuestion = !isContactStep && !isResultStep ? QUIZ_QUESTIONS[step - 1] : null;

  const calificado = useMemo(
    () => isResultStep && answers.every((a) => !a.descalifica),
    [isResultStep, answers]
  );

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isResultStep) return;

    const payload = {
      nombre: contact.nombre.trim(),
      email: contact.email.trim(),
      telefono: contact.telefono.trim(),
      utms: getStoredUtms(),
      calificado,
      respuestas: answers, // [{ pregunta, respuesta, descalifica }, ...]
    };
    // TODO: enviar a POST /leads cuando exista el backend.
    // El lead se guarda siempre (calificado o no) junto con `respuestas`
    // en la tabla respuestas_quiz, para el dashboard de % por pregunta.
    console.log('[quiz] resultado listo para enviar al backend:', payload);
  }, [isResultStep, calificado, answers, contact]);

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
  }

  function handleNext() {
    if (selected === null) return;
    const option = currentQuestion.options[selected];
    setAnswers([
      ...answers,
      { pregunta: currentQuestion.id, respuesta: option.value, descalifica: option.descalifica },
    ]);
    setSelected(null);
    setStep(step + 1);
  }

  function handleBack() {
    if (step === 1) {
      setSelected(null);
      setStep(CONTACT_STEP);
      return;
    }
    const prevQuestionIndex = step - 2; // índice 0-based de la pregunta a la que volvemos
    const prevQuestion = QUIZ_QUESTIONS[prevQuestionIndex];
    const prevAnswer = answers[prevQuestionIndex];
    const prevIndex = prevQuestion.options.findIndex((o) => o.value === prevAnswer.respuesta);
    setAnswers(answers.slice(0, -1));
    setSelected(prevIndex);
    setStep(step - 1);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          background: '#0C0C0C',
          border: '1px solid rgba(248,245,34,.35)',
          borderRadius: 14,
          boxShadow: '0 0 0 6px rgba(248,245,34,.06)',
          padding: '32px 28px',
          color: '#fff',
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'transparent',
            border: 'none',
            color: '#8A8A8A',
            fontSize: 22,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ×
        </button>

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
                disabled={selected === null}
                style={{
                  ...primaryButtonStyle,
                  background: selected === null ? 'rgba(248,245,34,.35)' : '#F8F522',
                  cursor: selected === null ? 'default' : 'pointer',
                }}
              >
                {step === QUIZ_QUESTIONS.length ? 'Ver resultado' : 'Siguiente'}
              </button>
            </div>
          </>
        )}

        {isResultStep && calificado && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={eyebrowStyle}>¡Calificas!</p>
            <h3 style={{ margin: '0 0 16px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 24 }}>
              Elige un horario para tu llamada
            </h3>
            <div
              style={{
                border: '1px dashed rgba(248,245,34,.4)',
                borderRadius: 12,
                padding: '28px 20px',
                color: '#B4B4B4',
                fontSize: 14,
                lineHeight: 1.5,
                marginBottom: 22,
              }}
            >
              Aquí va el selector de horario (ScheduleSlots) — se conecta a la disponibilidad real
              de Google Calendar en la Fase 3, una vez exista el backend.
            </div>
            <button onClick={onClose} style={primaryButtonStyle}>
              Cerrar
            </button>
          </div>
        )}

        {isResultStep && !calificado && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <h3 style={{ margin: '0 0 12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 24 }}>
              ¡Gracias por tu interés!
            </h3>
            <p style={{ margin: '0 0 22px', color: '#B4B4B4', fontSize: 15, lineHeight: 1.6 }}>
              Uno de nuestros asesores revisará tu información y te contactará pronto.
            </p>
            <button onClick={onClose} style={primaryButtonStyle}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
