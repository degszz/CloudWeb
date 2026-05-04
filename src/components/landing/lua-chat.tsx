'use client';

import { useEffect, useRef, useState } from 'react';

const INITIAL_MESSAGES = [
  { role: 'lua', text: 'Hola. Cuéntame qué quieres construir.' },
  { role: 'you', text: 'una web para mi estudio de cerámica' },
  { role: 'lua', text: 'Perfecto. ¿Vendés piezas o tomás encargos?' },
  { role: 'you', text: 'los dos. y quiero un blog corto.' },
];

const RESPONSES: Record<string, string> = {
  default:    'Entendido. Armando la estructura ahora mismo...',
  cafeteria:  'Una web para cafetería. ¿Querés mostrar el menú, horarios, o también encargos online?',
  portfolio:  'Portfolio. ¿Fotógrafo, diseñador, ilustrador? Eso cambia mucho el layout.',
  tienda:     'Tienda online. ¿Cuántos productos aproximadamente? ¿Tenés fotos ya?',
  restaurante:'Un restaurante. ¿Querés reservas online o solo información y menú?',
  consultora: 'Consultoría. ¿Querés capturar leads, mostrar casos de éxito, o las dos cosas?',
  blog:       'Blog. ¿Personal o profesional? ¿Querés newsletter integrado?',
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (/café|cafeteria|cafetería|coffee/.test(lower)) return RESPONSES.cafeteria!;
  if (/portfolio|portafolio|fotos|diseño|ilustra/.test(lower)) return RESPONSES.portfolio!;
  if (/tienda|vendo|productos|shop|ecommerce/.test(lower)) return RESPONSES.tienda!;
  if (/restaurante|bar|comida|menu|menú/.test(lower)) return RESPONSES.restaurante!;
  if (/consultor|asesor|servicios|b2b/.test(lower)) return RESPONSES.consultora!;
  if (/blog|escribo|artículos|noticias/.test(lower)) return RESPONSES.blog!;
  return RESPONSES.default!;
}

interface Msg { role: 'lua' | 'you'; text: string; }

export function LuaChat() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES as Msg[]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    // Skip first render to prevent page-level scroll on load
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    // Scroll only the chat container, not the whole page
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, typing]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'you', text }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { role: 'lua', text: getResponse(text) }]);
    }, 1200 + Math.random() * 600);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        background: 'var(--bg-2)',
        border: '1px solid var(--line-hard)',
        width: '100%',
        maxWidth: 380,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '1px solid var(--line)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-2)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--ink-strong)',
              animation: 'cw-blink 1.6s infinite',
            }}
          />
          lúa · en línea
        </span>
        <span style={{ color: 'var(--ink-3)' }}>demo</span>
      </div>

      {/* Messages */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '16px',
          minHeight: 220,
          maxHeight: 280,
          overflowY: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'you' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              padding: '8px 12px',
              ...(m.role === 'lua'
                ? {
                    background: 'var(--surface)',
                    borderLeft: '2px solid var(--ink-strong)',
                    fontFamily: 'var(--font-fraunces, var(--font-display))',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: 'var(--ink)',
                  }
                : {
                    background: 'var(--ink-strong)',
                    color: 'var(--bg)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                  }),
            }}
          >
            {m.role === 'lua' && (
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontStyle: 'normal',
                  color: 'var(--ink-3)',
                  marginBottom: 3,
                }}
              >
                Lúa
              </span>
            )}
            {m.text}
          </div>
        ))}
        {typing && (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '10px 14px',
              background: 'var(--surface)',
              borderLeft: '2px solid var(--ink-strong)',
              display: 'flex',
              gap: 4,
              alignItems: 'center',
            }}
          >
            {[0, 0.15, 0.3].map((delay, i) => (
              <span
                key={i}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--ink-2)',
                  animation: `cw-bob 1s ${delay}s infinite ease-in-out`,
                }}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); send(); }}
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 16px',
          borderTop: '1px solid var(--line)',
          alignItems: 'center',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="prueba: 'una web para mi cafetería'"
          disabled={typing}
          style={{
            flex: 1,
            border: 0,
            background: 'transparent',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={typing || !input.trim()}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '6px 10px',
            border: '1px solid var(--line-hard)',
            background: 'transparent',
            color: 'var(--ink-2)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          enviar
        </button>
      </form>
    </div>
  );
}
