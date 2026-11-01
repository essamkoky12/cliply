function toClock(value) {
  const total = Math.max(0, Math.floor(Number(value) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function fromClock(value) {
  const parts = value.trim().split(':');
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;
  const numbers = parts.map(Number);
  if (numbers.slice(1).some((part) => part > 59)) return null;
  return numbers.length === 2 ? numbers[0] * 60 + numbers[1] : numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
}

export default function TimeInput({ label, value, onChange, disabled }) {
  return (
    <label>
      <span className="time-label">{label}</span>
      <input
        className="time-input"
        type="text"
        inputMode="numeric"
        value={toClock(value)}
        disabled={disabled}
        aria-label={`${label} time`}
        onChange={(event) => {
          const parsed = fromClock(event.target.value);
          if (parsed !== null) onChange(parsed);
        }}
        onBlur={(event) => {
          const parsed = fromClock(event.target.value);
          if (parsed !== null) onChange(parsed);
          else event.target.value = toClock(value);
        }}
      />
    </label>
  );
}
