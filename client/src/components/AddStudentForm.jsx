import { useState } from "react";

function AddStudentForm({ onAdd, disabled }) {
  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [score, setScore] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;

    if (name.trim() === "" || major.trim() === "" || score === "") {
      return;
    }

    setSaving(true);
    const saved = await onAdd({
      name: name.trim(),
      major: major.trim(),
      score: Number(score)
    });

    setSaving(false);
    if (!saved) return;
    setName("");
    setMajor("");
    setScore("");
  }

  return (
    <section className="panel">
      <h2>Add Student</h2>

      <form onSubmit={handleSubmit} className="form-row">
        <input
          type="text"
          placeholder="Name"
          aria-label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled || saving}
        />

        <input
          type="text"
          placeholder="Major"
          aria-label="Major"
          required
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          disabled={disabled || saving}
        />

        <input
          type="number"
          min="0"
          max="100"
          placeholder="Score"
          aria-label="Score"
          required
          value={score}
          onChange={(e) => setScore(e.target.value)}
          disabled={disabled || saving}
        />

        <button type="submit" disabled={disabled || saving}>
          {saving ? "Adding..." : "Add"}
        </button>
      </form>

      {disabled && (
        <p className="note">Login first to add students.</p>
      )}
    </section>
  );
}

export default AddStudentForm;
