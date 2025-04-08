import { useState } from 'react';
import axios from 'axios';
import './UploadForm.css'; // Link to the CSS file

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false); // Loader state

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !answer) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('answer', answer);

    try {
      setLoading(true);
      const res = await axios.post('https://hand-written-evaluation.vercel.app/evaluate', formData);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Evaluate Handwritten Answer</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <label>
          Upload Image:
          <input type="file" onChange={e => setFile(e.target.files[0])} />
        </label>

        <label>
          Predefined Answer:
          <textarea
            placeholder="Enter predefined answer"
            onChange={e => setAnswer(e.target.value)}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Evaluating..." : "Evaluate"}
        </button>
      </form>

      {loading && <div className="loader"></div>}

      {!loading && result && (
        <div className="result-box">
          <h3>Evaluation Result</h3>
          <p><strong>Extracted Text:</strong> {result.corrected_text}</p>
          <p><strong>Similarity Score:</strong> {result.similarity_score}%</p>
          <p className={result.similarity_score >= 60 ? "correct" : "incorrect"}>
            Verdict: {result.similarity_score >= 60 ? "Correct" : "Incorrect"}
          </p>
        </div>
      )}
    </div>
  );
}
